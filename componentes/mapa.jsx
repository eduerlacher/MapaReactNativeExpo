import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import mapHtml from '../assets/map.html';

export default function MapScreen() {
  //tem usar useState pra alterar isso
  const webviewRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      // permissões e coisas assim ^
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada');
        setLoading(false);
        return;
      }
      //pega a localização do usuário e a precisão 
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(pos.coords);
      setLoading(false);
    })();
  }, []);

  // Manda a localização pro mapa assim que ELE avisar que carregou
  useEffect(() => {
    if (location && mapReady) {
      sendLocationToMap();
    }
  }, [location, mapReady]);

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
    } catch(e){
      console.warn('Erro ao processar mensagem do mapa:', e);
    }
  };
  // mensagem de carregamento
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Buscando sua localização...</Text>
      </View>
    );
  }
  // mensagem de erro
  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }
  // ver o mapa, basicamente
  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={mapHtml}
      style={styles.webview}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}

// coisas de style pra ficar no meio
const styles = StyleSheet.create({
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});