import { StyleSheet, StatusBar as NativeStatusBar } from 'react-native';

// styles :)
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingTop: NativeStatusBar.currentHeight || 0,
  },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF' },

  // Erro do mapa e botão de recarregar
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

  // Detalhes do ponto selecionado
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

  // Botões da tela de detalhes
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

  // Modal de escolha do aplicativo de navegação
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
