// Network to asset mapping - first asset is the network's native token
// Added cross-network assets to support holdings across different networks
export const NETWORK_ASSETS: Record<string, string[]> = {
  'ripple': ['XRP', 'USDT', 'XDC'],
  'polygon': ['MATIC', 'USDT', 'XDC'],
  'xdc': ['XDC', 'USDT', 'XRP']
};
