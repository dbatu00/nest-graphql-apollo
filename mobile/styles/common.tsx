// mobile/styles/common.ts
import { StyleSheet, Platform } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: { flex: 1, padding: 0 },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },

  card: {
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
    }),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },

  cardName: {
    fontWeight: 'bold',
    fontSize: 18,
  },

  cardId: {
    color: '#666',
    marginTop: 4,
  },
   button: {
  flex: 1,
  maxWidth: 180,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: '#2563eb',
  alignItems: 'center',
},
  disabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
    center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
  flexDirection: 'row',
  gap: 16,
  marginTop: 20,
  justifyContent: 'center',
  alignSelf: 'center',
  maxWidth: 420,
  width: '100%',
},
});
