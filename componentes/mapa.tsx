import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Pressable, StatusBar as NativeStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewErrorEvent, WebViewHttpErrorEvent, WebViewMessageEvent, WebViewSource } from 'react-native-webview/lib/WebViewTypes';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import mapHtml from '../assets/map.html';
import { locations } from '../dados/locations';
import type { Coordinates, Location as LocationData, NavigationApp } from '../dominio/interfaces';
import { AvailabilityService } from '../servicos/disponibilidade';
import { AppNavigationService } from '../servicos/navegacao';

// Troca de mensagens entre o mapa e o app
type MapMessage =
  | { type: 'MAP_READY' }
  | { type: 'MAP_CLICK'; lat: number; long: number }
  | { type: 'PIN_CLICK'; pin: { id: string } };

// Serviços de verificação de disponibilidade e navegação(escolha de rotas)
const availabilityService = new AvailabilityService();
const navigationService = new AppNavigationService();

// Tela do mapa
export default function MapScreen() {

  // DECLARAÇÃO DE CONSTANTES "SIMPLES" =================================================

  // Referência para controlar o WebView do mapa e enviar mensagens para o HTML embutido.
  const webviewRef = useRef<WebView>(null);
  // Lista de pontos do mapa exibidos no leaflet/HTML do mapa.
  const pins = locations;
  // Coordenadas da localização atual do usuário em latitude/longitude.
  const [location, setLocation] = useState<Coordinates | null>(null);

  // Mensagem de erro de permissão/localização para exibir na tela.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Indica se a localização do usuário ainda está sendo carregada.
  const [loading, setLoading] = useState(true);

  // Marca se o mapa já foi inicializado e está pronto para receber dados.
  const [mapReady, setMapReady] = useState(false);

  // Erro específico ao carregar o conteúdo do mapa em HTML.
  const [mapError, setMapError] = useState<string | null>(null);

  // Conteúdo HTML do mapa carregado a partir do asset local.
  const [mapHtmlContent, setMapHtmlContent] = useState<string | null>(null);

  // Ponto selecionado pelo usuário no mapa para exibir detalhes ou rota.
  const [selectedPin, setSelectedPin] = useState<LocationData | null>(null);

  // Controla a visibilidade do modal/caixa de opções de rota.
  const [routeOptionsVisible, setRouteOptionsVisible] = useState(false);

  // ======================================================================================

  // Função para obter a disponibilidade de um ponto com base em seus horários de funcionamento.
  const getAvailability = (openingHours: LocationData['openingHours']): string =>
    availabilityService.getStatus(openingHours);

  // Função para abrir o aplicativo de navegação escolhido com a rota para o ponto selecionado.
  const openNavigationApp = async (app: NavigationApp): Promise<void> => {
    if (!selectedPin) {
      return;
    }

    try {
      await navigationService.openRoute(app, selectedPin, location);
      setRouteOptionsVisible(false);
    } catch (error) {
      console.warn(`Não foi possível abrir ${app}:`, error);
      if (error instanceof Error && error.message === 'LOCATION_REQUIRED_FOR_UBER') {
        setRouteOptionsVisible(false);
        alert('A localização atual é necessária para abrir uma rota no Uber.');
      } else {
        alert(`O aplicativo ${app} não está instalado ou não pode abrir esta rota.`);
      }
    }
  };

  // Carrega o conteúdo HTML do mapa a partir do asset local e lida com erros de carregamento.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const asset = await Asset.fromModule(mapHtml).downloadAsync();

        // Verifica se o asset foi carregado corretamente e se a URI local está disponível.
        if (!asset.localUri) {
          throw new Error('MAP_HTML_URI_UNAVAILABLE');
        }

        // Faz uma requisição fetch para obter o conteúdo do HTML do mapa.
        const response = await fetch(asset.localUri);
        if (!response.ok) {
          throw new Error(`MAP_HTML_READ_FAILED_${response.status}`);
        }

        // Lê o conteúdo do HTML como texto e atualiza o estado se não houver cancelamento.
        const html = await response.text();
        if (!cancelled) {
          setMapHtmlContent(html);
        }
      } 
      // Mensagens de erro para HTML e o mapa
      catch (error) {
        console.warn('Não foi possível carregar o HTML do mapa:', error);
        if (!cancelled) {
          setMapError('Não foi possível carregar o mapa.');
        }
      }
    })();

    // Limpeza do efeito para evitar atualizações de estado após o componente ser desmontado. 
    return () => {
      cancelled = true;
    };
  }, []);

  // Efeito para obter a localização atual do usuário e lidar com erros(como sempre).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setErrorMsg('Permissão de localização negada. Ative-a nas configurações do Android.');
          }
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (!cancelled) {
            setErrorMsg('O serviço de localização está desativado. Ative o GPS e tente novamente.');
          }
          return;
        }

        const timeout: Promise<never> = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 15000);
        });
        const position = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const pos = await Promise.race([position, timeout]);

        if (!cancelled) {
          setLocation({ lat: pos.coords.latitude, long: pos.coords.longitude });
        }
      } catch (error) {
        console.warn('Não foi possível obter a localização:', error);
        if (!cancelled) {
          setErrorMsg(
            error instanceof Error && error.message === 'LOCATION_TIMEOUT'
              ? 'A localização demorou demais. Verifique o GPS e tente novamente.'
              : 'Não foi possível obter sua localização. Verifique o GPS e as permissões do Android.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Manda a localização pro mapa assim que ELE avisar que carregou
  useEffect(() => {
    if (location && mapReady) {
      sendLocationToMap();
    }
  }, [location, mapReady]);

  useEffect(() => {
    if (mapReady) {
      webviewRef.current?.postMessage(JSON.stringify({
        type: 'SET_PINS',
        pins,
      }));
    }
  }, [mapReady]);

  const sendLocationToMap = () => {
    if (!location) {
      return;
    }

    const msg = JSON.stringify({
      type: 'SET_USER_LOCATION',
      lat: location.lat,
      long: location.long,
    });
    webviewRef.current?.postMessage(msg);
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as MapMessage;
      if (data.type === 'MAP_READY') {
        setMapReady(true);
      }
      if (data.type === 'MAP_CLICK') {
        console.log('Clicou em:', data.lat, data.long);
      }
      if (data.type === 'PIN_CLICK') {
        const location = locations.find(item => item.id === data.pin.id);
        if (location) {
          setSelectedPin(location);
        }
      }
    } catch (error) {
      console.warn('Erro ao processar mensagem do mapa:', error);
    }
  };

  const handleMapError = (event: WebViewErrorEvent) => {
    const description = event.nativeEvent.description || 'Não foi possível carregar o mapa.';
    console.warn('Erro ao carregar o mapa:', description);
    setMapError('Não foi possível carregar o mapa. Verifique sua conexão com a internet.');
  };

  const handleMapHttpError = (event: WebViewHttpErrorEvent) => {
    const { statusCode, description } = event.nativeEvent;
    console.warn(`Erro HTTP do mapa (${statusCode}):`, description);
    setMapError(`O mapa retornou um erro de rede (${statusCode}). Verifique sua conexão.`);
  };

  const reloadMap = () => {
    setMapError(null);
    setMapReady(false);
    webviewRef.current?.reload();
  };

  // mensagem de carregamento
  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Buscando sua localização...</Text>
        </View>
      </View>
    );
  }
  // mensagem de erro
  if (errorMsg) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  // ver o mapa, basicamente
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={mapHtmlContent ? { html: mapHtmlContent, baseUrl: 'https://localhost/' } : { html: '' }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          onError={handleMapError}
          onHttpError={handleMapHttpError}
          onLoadStart={() => setMapError(null)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          androidLayerType="software"
        />

        {mapError && (
          <View style={styles.mapErrorOverlay}>
            <Text style={styles.mapErrorText}>{mapError}</Text>
            <Pressable style={styles.reloadButton} onPress={reloadMap}>
              <Text style={styles.reloadButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        {selectedPin && (
          <View style={styles.detailsOverlay}>
            <Text selectable style={styles.detailsTitle}>{selectedPin.title}</Text>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Endereço</Text>
              <Text selectable style={styles.detailsValue}>
                {selectedPin.address.street}, {selectedPin.address.number}
              </Text>
              <Text selectable style={styles.detailsValue}>
                {selectedPin.address.neighborhood} - {selectedPin.address.city}/{selectedPin.address.state}
              </Text>
              <Text selectable style={styles.detailsValue}>
                CEP: {selectedPin.address.zipCode}
              </Text>
            </View>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Telefone</Text>
              <Text selectable style={styles.detailsValue}>{selectedPin.phone}</Text>
            </View>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Disponibilidade</Text>
              <Text selectable style={styles.detailsValue}>
                {getAvailability(selectedPin.openingHours)}
              </Text>
            </View>
            <Pressable
              style={styles.routeButton}
              onPress={() => setRouteOptionsVisible(true)}
            >
              <Text style={styles.routeButtonText}>Calcular rota</Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={() => setSelectedPin(null)}>
              <Text style={styles.backButtonText}>Voltar ao mapa</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        visible={routeOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRouteOptionsVisible(false)}
      >
        <View style={styles.routeModalOverlay}>
          <View style={styles.routeModalCard}>
            <Text style={styles.routeModalTitle}>Abrir rota com</Text>
            <Pressable
              style={styles.routeOption}
              onPress={() => openNavigationApp('google-maps')}
            >
              <Text style={styles.routeOptionText}>Google Maps</Text>
            </Pressable>
            <Pressable
              style={styles.routeOption}
              onPress={() => openNavigationApp('waze')}
            >
              <Text style={styles.routeOptionText}>Waze</Text>
            </Pressable>
            <Pressable
              style={styles.routeOption}
              onPress={() => openNavigationApp('uber')}
            >
              <Text style={styles.routeOptionText}>Uber</Text>
            </Pressable>
            <Pressable
              style={styles.cancelOption}
              onPress={() => setRouteOptionsVisible(false)}
            >
              <Text style={styles.cancelOptionText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// coisas de style pra ficar no meio
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingTop: NativeStatusBar.currentHeight || 0,
  },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapErrorOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  mapErrorText: {
    color: '#243B53',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  reloadButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#1976D2',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingText: { color: '#FFFFFF' },
  detailsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  detailsTitle: {
    color: '#172B4D',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailsType: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 28,
  },
  detailsSection: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#D9E2EC',
  },
  detailsLabel: {
    color: '#52606D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailsValue: {
    color: '#243B53',
    fontSize: 16,
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#1976D2',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  routeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  routeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  routeModalCard: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  routeModalTitle: {
    color: '#172B4D',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  routeOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D9E2EC',
  },
  routeOptionText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelOption: {
    alignSelf: 'flex-end',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cancelOptionText: {
    color: '#52606D',
    fontSize: 15,
    fontWeight: '700',
  },
});