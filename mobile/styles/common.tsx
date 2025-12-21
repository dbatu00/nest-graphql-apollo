// mobile/styles/common.ts
import { StyleSheet, Platform } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

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
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
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
});
