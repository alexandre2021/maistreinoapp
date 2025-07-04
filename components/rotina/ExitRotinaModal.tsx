// components/rotina/ExitRotinaModal.tsx
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExitRotinaModalProps {
 visible: boolean;
 onConfirmExit: () => void;
 onCancel: () => void;
}

export const ExitRotinaModal: React.FC<ExitRotinaModalProps> = ({
 visible,
 onConfirmExit,
 onCancel
}) => {
 return (
   <Modal
     visible={visible}
     transparent
     animationType="fade"
     onRequestClose={onCancel}
     accessible={false}
     importantForAccessibility="no"
   >
     <View style={styles.overlay}>
       <View style={styles.container}>
         <View style={styles.iconContainer}>
           <AlertTriangle size={48} color="#F59E0B" />
         </View>

         <Text style={styles.title}>Confirmar saída</Text>
         
         <Text style={styles.message}>
           Tem certeza que deseja sair da criação da rotina?
         </Text>

         <View style={styles.buttonContainer}>
           <TouchableOpacity
             style={[styles.button, styles.cancelButton]}
             onPress={onCancel}
           >
             <Text style={styles.cancelButtonText}>Cancelar</Text>
           </TouchableOpacity>

           <TouchableOpacity
             style={[styles.button, styles.confirmButton]}
             onPress={onConfirmExit}
           >
             <Text style={styles.confirmButtonText}>Sair</Text>
           </TouchableOpacity>
         </View>
       </View>
     </View>
   </Modal>
 );
};

const styles = StyleSheet.create({
 overlay: {
   flex: 1,
   backgroundColor: 'rgba(0, 0, 0, 0.6)',
   justifyContent: 'center',
   alignItems: 'center',
   padding: 20,
 },
 container: {
   backgroundColor: '#FFFFFF',
   borderRadius: 16,
   padding: 24,
   width: '100%',
   maxWidth: 400,
   alignItems: 'center',
 },
 iconContainer: {
   marginBottom: 16,
 },
 title: {
   fontSize: 20,
   fontWeight: '700',
   color: '#1F2937',
   marginBottom: 8,
   textAlign: 'center',
 },
 rotinaName: {
   fontSize: 16,
   fontWeight: '600',
   color: '#007AFF',
   marginBottom: 12,
   textAlign: 'center',
   fontStyle: 'italic',
 },
 message: {
   fontSize: 16,
   color: '#4B5563',
   textAlign: 'center',
   marginBottom: 16,
   lineHeight: 22,
 },
 buttonContainer: {
   flexDirection: 'row',
   gap: 12,
   width: '100%',
 },
 button: {
   flex: 1,
   paddingVertical: 12,
   paddingHorizontal: 16,
   borderRadius: 8,
   alignItems: 'center',
   justifyContent: 'center',
   minHeight: 44,
 },
 cancelButton: {
   backgroundColor: '#F9FAFB',
   borderWidth: 1,
   borderColor: '#E5E7EB',
 },
 cancelButtonText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#374151',
 },
 confirmButton: {
   backgroundColor: '#6B7280',
 },
 confirmButtonText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#FFFFFF',
 },
});