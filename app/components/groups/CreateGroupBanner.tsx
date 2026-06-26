import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Dayxo } from '../../constants/dayxo';

// Banner con gradiente naranja → violeta (mismo del código de amigo) para crear grupo.
export function CreateGroupBanner({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={[Dayxo.orange, Dayxo.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Creá un grupo nuevo</Text>
          <Text style={styles.subtitle}>Competí y sumá XP con tus amigos</Text>
        </View>
        <View style={styles.plusBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 16, gap: 12,
  },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  subtitle: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  plusBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center',
  },
});
