import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface YoutubeUrlModalProps {
  visible: boolean;
  initialUrl?: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

export const YoutubeUrlModal: React.FC<YoutubeUrlModalProps> = ({ visible, initialUrl = '', onSave, onClose }) => {
  const [url, setUrl] = useState(initialUrl);
  const isValid = url.includes('youtube.com') || url.includes('youtu.be');

  React.useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Adicionar link do YouTube</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="Cole aqui o link do YouTube"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {url.length > 0 && !isValid && (
            <Text style={styles.error}>URL inválida. Use links do YouTube.</Text>
          )}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.save, !isValid && styles.saveDisabled]} onPress={() => isValid && onSave(url)} disabled={!isValid}>
              <Text style={styles.saveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: 'white', borderRadius: 12, padding: 24, width: 320, alignItems: 'stretch' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1F2937' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 8 },
  error: { color: '#EF4444', fontSize: 14, marginBottom: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  cancel: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelText: { color: '#6B7280', fontSize: 16 },
  save: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  saveDisabled: { backgroundColor: '#9CA3AF' },
  saveText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
