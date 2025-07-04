// components/ExerciseCounter.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExerciseCounterProps {
  currentCount: number;
  totalLimit: number;
  planType: string;
  onUpgradePress?: () => void;
}

export const ExerciseCounter: React.FC<ExerciseCounterProps> = ({
  currentCount,
  totalLimit,
  planType,
  onUpgradePress
}) => {
  const isUnlimited = totalLimit === -1;
  const isNearLimit = !isUnlimited && currentCount >= totalLimit * 0.8;
  const isAtLimit = !isUnlimited && currentCount >= totalLimit;

  const getProgressColor = () => {
    if (isAtLimit) return '#EF4444';
    if (isNearLimit) return '#F59E0B';
    return '#10B981';
  };

  const getProgressPercentage = () => {
    if (isUnlimited) return 0;
    return Math.min((currentCount / totalLimit) * 100, 100);
  };

  const getStatusText = () => {
    if (isUnlimited) {
      return 'Exercícios ilimitados';
    }
    
    if (isAtLimit) {
      return `Limite atingido (${currentCount}/${totalLimit})`;
    }
    
    return `${currentCount} de ${totalLimit} exercícios`;
  };

  const getStatusMessage = () => {
    if (isUnlimited) return null;
    
    if (isAtLimit) {
      return 'Faça upgrade para criar mais exercícios personalizados';
    }
    
    if (isNearLimit) {
      return `Você está próximo do limite do plano ${planType}`;
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.countInfo}>
          <Text style={styles.countText}>{getStatusText()}</Text>
          <Text style={styles.planText}>Plano {planType}</Text>
        </View>
        
        {(isAtLimit || isNearLimit) && onUpgradePress && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={onUpgradePress}
          >
            <Ionicons name="arrow-up-circle" size={16} color="#3B82F6" />
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isUnlimited && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getProgressColor()
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: getProgressColor() }]}>
            {Math.round(getProgressPercentage())}%
          </Text>
        </View>
      )}

      {getStatusMessage() && (
        <View style={styles.messageContainer}>
          <Ionicons 
            name={isAtLimit ? "warning" : "information-circle"} 
            size={16} 
            color={isAtLimit ? "#F59E0B" : "#6B7280"} 
          />
          <Text style={[
            styles.messageText,
            { color: isAtLimit ? "#F59E0B" : "#6B7280" }
          ]}>
            {getStatusMessage()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countInfo: {
    flex: 1,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  planText: {
    fontSize: 14,
    color: '#6B7280',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  messageText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
});