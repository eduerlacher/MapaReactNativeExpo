import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Modal, Pressable, StatusBar as NativeStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import mapHtml from '../assets/map.html';
import { localizacoes } from '../dados/localizacoes';

export default function MapScreen() {
  //tem usar useState pra alterar isso
  const webviewRef = useRef(null);
  const pins = localizacoes;
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [routeOptionsVisible, setRouteOptionsVisible] = useState(false);

  const getAvailability = (openingHours) => {
    if (openingHours === '24/7') {
      return 'Aberto 24 horas';
    }

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const todayHours = openingHours?.[dayNames[new Date().getDay()]];

    if (!todayHours) {
      return 'Fechado hoje';
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    const openingMinutes = openHour * 60 + openMinute;
    const closingMinutes = closeHour * 60 + closeMinute;

    if (currentMinutes >= openingMinutes && currentMinutes <= closingMinutes) {
      return `Aberto agora, até ${todayHours.close}`;
    }

    return `Fechado agora, funciona até ${todayHours.close}`;
  };

  const openNavigationApp = async (app) => {
    if (!selectedPin) {
      return;
    }

    const destination = `${selectedPin.latitude},${selectedPin.longitude}`;
    const origin = location
      ? `${location.latitude},${location.longitude}`
      : null;
    let url;

    if (app === 'google-maps') {
      const originQuery = origin ? `&origin=${encodeURIComponent(origin)}` : '';
      url = `https://www.google.com/maps/dir/?api=1${originQuery}&destination=${encodeURIComponent(destination)}`;
    }

    if (app === 'waze') {
      url = `https://waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`;
    }

    if (app === 'uber') {
      if (!origin) {
        setRouteOptionsVisible(false);
        alert('A localização atual é necessária para abrir uma rota no Uber.');
        return;
      }

      url = `uber://?action=setPickup&pickup[latitude]=${location.latitude}&pickup[longitude]=${location.longitude}&dropoff[latitude]=${selectedPin.latitude}&dropoff[longitude]=${selectedPin.longitude}`;
    }

    try {
      await Linking.openURL(url);
      setRouteOptionsVisible(false);
    } catch (error) {
      console.warn(`Não foi possível abrir ${app}:`, error);
      alert(`O aplicativo ${app} não está instalado ou não pode abrir esta rota.`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(pos.coords);
      } catch (error) {
        console.warn('Não foi possível obter a localização:', error);
        setErrorMsg('Não foi possível obter sua localização. Verifique se o GPS está ativado.');
      } finally {
        setLoading(false);
      }
    })();
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
    const msg = JSON.stringify({
      type: 'SET_USER_LOCATION',
      lat: location.latitude,
      lon: location.longitude,
    });
    webviewRef.current?.postMessage(msg);
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setMapReady(true);
      }
      if (data.type === 'MAP_CLICK') {
        console.log('Clicou em:', data.lat, data.lon);
      }
      if (data.type === 'PIN_CLICK') {
        const location = localizacoes.find(item => item.id === data.pin.id);
        if (location) {
          setSelectedPin(location);
        }
      }
    } catch (e) {
      console.warn('Erro ao processar mensagem do mapa:', e);
    }
  };
  // mensagem de carregamento
  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" backgroundColor="#1976D2" />
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
        <StatusBar style="light" backgroundColor="#1976D2" />
        <View style={styles.center}>
          <Text>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  // ver o mapa, basicamente
  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor="#1976D2" />
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={mapHtml}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          androidLayerType="software"
        />

        {selectedPin && (
          <View style={styles.detailsOverlay}>
            <Text style={styles.detailsTitle}>{selectedPin.title}</Text>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Endereço</Text>
              <Text style={styles.detailsValue}>
                {selectedPin.address.street}, {selectedPin.address.number}
              </Text>
              <Text style={styles.detailsValue}>
                {selectedPin.address.neighborhood} - {selectedPin.address.city}/{selectedPin.address.state}
              </Text>
              <Text style={styles.detailsValue}>
                CEP: {selectedPin.address.zipCode}
              </Text>
            </View>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Telefone</Text>
              <Text style={styles.detailsValue}>{selectedPin.telefone}</Text>
            </View>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsLabel}>Disponibilidade</Text>
              <Text style={styles.detailsValue}>
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