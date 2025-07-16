import { Tabs, router } from 'expo-router';
import { ChevronDown, Dumbbell, Home, Info, LogOut, Settings, TrendingUp, User, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusInfoModal } from '../../components/StatusInfoModal';
import { useAvatar } from '../../context/AvatarContext';
import { useAvatarPrefetch } from '../../hooks/useAvatarPrefetch';
import { supabase } from '../../lib/supabase';

interface UserData {
  id: string
  nome_completo: string
  avatar_letter: string
  avatar_color: string
  avatar_type: 'letter' | 'image'
  avatar_image_url: string | null
  user_type: 'personal_trainer' | 'aluno'
}

// ✅ COMPONENTE AVATAR SUPER OTIMIZADO - SEM DEPENDÊNCIAS EXTERNAS
const FastAvatar = React.memo(({ userData, avatarUri }: { userData: UserData | null, avatarUri: string | null }) => {
  console.log('🖼️ [FastAvatar] Renderizando avatar');
  
  if (!userData) {
    console.log('⚪ [FastAvatar] Renderizando avatar padrão');
    return (
      <View style={fastAvatarStyles.avatar}>
        <Text style={fastAvatarStyles.text}>U</Text>
      </View>
    );
  }

  if (userData.avatar_type === 'image' && avatarUri) {
    console.log('🖼️ [FastAvatar] Renderizando avatar com imagem');
    return (
      <Image 
        source={{ uri: avatarUri }} 
        style={fastAvatarStyles.image}
        resizeMode="cover"
      />
    );
  }

  console.log('🔤 [FastAvatar] Renderizando avatar com letra:', userData.avatar_letter);
  return (
    <View style={[fastAvatarStyles.avatar, { backgroundColor: userData.avatar_color || '#60A5FA' }]}>
      <Text style={fastAvatarStyles.text}>
        {userData.avatar_letter || userData.nome_completo?.[0] || 'U'}
      </Text>
    </View>
  );
});

// ✅ CORREÇÃO: Adicionar display name
FastAvatar.displayName = 'FastAvatar';

// Componente customizado para o background do tab bar
const ModernTabBarBackground = ({ insets }: { insets: any }) => {
  const isAndroid = Platform.OS === 'android';
  const minimumBottomPadding = 24;
  const androidExtraSpace = 16;
  
  const bottomPadding = isAndroid 
    ? Math.max(insets.bottom, minimumBottomPadding) + androidExtraSpace
    : Math.max(insets.bottom, minimumBottomPadding);

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      height: 80 + bottomPadding,
      ...(isAndroid ? {
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      })
    }}>
      {/* Borda superior com gradiente sutil */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#E2E8F0',
      }} />
      
      {/* Highlight bar - linha decorativa no topo */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: 3,
        backgroundColor: '#A11E0A',
        borderRadius: 2,
      }} />
      
      {/* Área inferior para Android */}
      {isAndroid && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: bottomPadding,
          backgroundColor: '#F8FAFC',
        }} />
      )}
    </View>
  );
};

// Componente customizado para ícones animados
const AnimatedTabIcon = ({ 
  IconComponent, 
  color, 
  size, 
  focused, 
  label 
}: { 
  IconComponent: any, 
  color: string, 
  size: number, 
  focused: boolean,
  label: string 
}) => {
  const [scaleAnim] = useState(new Animated.Value(focused ? 1 : 0.9));
  const [translateAnim] = useState(new Animated.Value(focused ? -2 : 0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(translateAnim, {
        toValue: focused ? -3 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  }, [focused, scaleAnim, translateAnim]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Animated.View 
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY: translateAnim }
          ],
          backgroundColor: focused ? `${color}15` : 'transparent',
          borderRadius: 12,
          padding: 8,
          minWidth: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconComponent 
          size={size} 
          color={color} 
          strokeWidth={focused ? 2.5 : 2}
        />
      </Animated.View>
      
      {/* Indicador pontinho para tab ativo */}
      {focused && (
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginTop: 4,
          opacity: 0.8,
        }} />
      )}
    </View>
  );
};

// Componente para label customizado
const AnimatedTabLabel = ({ 
  label, 
  focused, 
  color 
}: { 
  label: string, 
  focused: boolean, 
  color: string 
}) => {
  const [opacityAnim] = useState(new Animated.Value(focused ? 1 : 0.7));

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, opacityAnim]);

  return (
    <Animated.Text 
      style={{
        fontSize: focused ? 13 : 12,
        fontWeight: focused ? '700' : '600',
        color: color,
        opacity: opacityAnim,
        marginTop: 2,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Animated.Text>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuAnimation] = useState(new Animated.Value(0))
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { avatarUri, setAvatarUri } = useAvatar();
  useAvatarPrefetch(avatarUri ?? undefined);

  // Modal manager para status info
  const [modals, setModals] = useState({ statusInfo: false });
  const openModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: true }));
  const closeModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: false }));

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  const loadUserData = useCallback(async () => {
    try {
      console.log('🔍 [TABS] Carregando dados do perfil...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('🚫 [TABS] Usuário não encontrado');
        return;
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.log('🚫 [TABS] Perfil não encontrado');
        return;
      }

      const { data } = await supabase
        .from(profile.user_type === 'personal_trainer' ? 'personal_trainers' : 'alunos')
        .select('id, nome_completo, avatar_letter, avatar_color, avatar_type, avatar_image_url')
        .eq('id', user.id)
        .single();

      if (data) {
        console.log('✅ [TABS] Dados do usuário carregados:', profile.user_type);
        setUserData({ ...data, user_type: profile.user_type as 'personal_trainer' | 'aluno' });
        if (data.avatar_image_url) {
          setAvatarUri(data.avatar_image_url);
        }
      }
    } catch (error) {
      console.error('❌ [TABS] Erro ao carregar dados:', error);
    }
  }, [setAvatarUri]);

  useEffect(() => {
    console.log('🔗 [TABS] Configurando listener de auth...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [TABS] Mudança de auth:', event, session ? 'LOGADO' : 'DESLOGADO');
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 [TABS] Logout detectado - redirecionando para login...');
        setUserData(null);
        setAvatarUri(null);
        router.replace('/');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ [TABS] Login detectado - recarregando dados...');
        loadUserData();
      }
    });

    return () => {
      console.log('🔌 [TABS] Desconectando listener de auth...');
      subscription.unsubscribe();
    };
  }, [loadUserData, setAvatarUri]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData, setAvatarUri]);

  const handleLogout = async () => {
    try {
      console.log('🚪 [TABS] Iniciando logout...');
      showToast('Saindo...')
      // ✅ CORREÇÃO: Esconde o menu instantaneamente, sem animação.
      setShowMenu(false);
      setUserData(null);
      setAvatarUri(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [TABS] Erro no logout:', error);
        showToast('Erro ao sair. Tente novamente.');
      } else {
        console.log('✅ [TABS] Logout realizado com sucesso');
      }
    } catch (error) {
      console.error('💥 [TABS] Erro inesperado no logout:', error);
      showToast('Erro inesperado. Tente novamente.');
    }
  }

  // ✅ TOGGLE MENU SUPER OTIMIZADO - RESPOSTA INSTANTÂNEA
  const toggleMenuFast = () => {
    console.log('🖱️ [AVATAR] toggleMenuFast chamado em:', Date.now());
    console.log('📊 [AVATAR] showMenu atual:', showMenu);
    
    if (showMenu) {
      console.log('❌ [AVATAR] Fechando menu...');
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 100, // Mais rápido ainda
        useNativeDriver: true,
      }).start(() => {
        console.log('✅ [AVATAR] Menu fechado em:', Date.now());
        setShowMenu(false);
      });
    } else {
      console.log('✅ [AVATAR] Abrindo menu IMEDIATAMENTE...');
      const startTime = Date.now();
      
      setShowMenu(true);
      console.log('📱 [AVATAR] setShowMenu(true) executado em:', Date.now() - startTime, 'ms');
      
      // ✅ FORÇA VALOR DIRETO - SEM ANIMAÇÃO PARA ABERTURA INSTANTÂNEA
      menuAnimation.setValue(1);
      console.log('🎯 [AVATAR] Menu aberto instantaneamente em:', Date.now() - startTime, 'ms');
    }
  }

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => setShowMenu(false))
  }

  const handleMenuOption = (option: string) => {
    closeMenu()
    setTimeout(() => {
      switch (option) {
        case 'perfil':
          if (!userData?.user_type) {
            showToast('Tipo de usuário não identificado. Faça login novamente.');
            console.error('[TABS] user_type indefinido ao tentar acessar perfil. userData:', userData);
            return;
          }
          const profilePath = userData.user_type === 'personal_trainer' ? '/perfil-pt/perfil-pt' : '/perfil-aluno/perfil-aluno';
          router.push(profilePath);
          break;
        case 'configuracoes':
          showToast('Configurações em desenvolvimento');
          break;
        case 'sair':
          handleLogout();
          break;
      }
    }, 50) // ✅ Reduzido ainda mais
  }

  // ✅ HEADER RIGHT SUPER OTIMIZADO
  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity 
        style={styles.avatarButton} 
        onPress={toggleMenuFast} // ✅ Usando função super otimizada
        onPressIn={() => console.log('👆 [AVATAR] onPressIn detectado em:', Date.now())}
        onPressOut={() => console.log('👋 [AVATAR] onPressOut detectado em:', Date.now())}
        activeOpacity={0.9} // ✅ Quase sem efeito visual
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // ✅ Área bem maior
        delayPressIn={0}
        delayPressOut={0}
        pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }} // ✅ FORÇA RESPONSIVIDADE MÁXIMA
      >
        <FastAvatar userData={userData} avatarUri={avatarUri} />
        <ChevronDown 
          size={16} 
          color="#64748B" 
          style={[
            styles.chevron, 
            { 
              transform: [{ 
                rotate: showMenu ? '180deg' : '0deg' 
              }] 
            }
          ]} 
        />
      </TouchableOpacity>
    </View>
  )

  const renderAlunosHeaderLeft = () => (
    <View style={styles.headerLeftContainer}>
      <TouchableOpacity 
        onPress={() => openModal('statusInfo')}
        style={styles.infoButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Info size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  )

  // ✅ MODAL SIMPLIFICADO - SEM ANIMAÇÕES COMPLEXAS
  const renderDropdownMenu = () => {
    console.log('📋 [MODAL] renderDropdownMenu chamado, showMenu:', showMenu);
    
    if (!showMenu) return null;
    
    return (
      <Modal 
        visible={showMenu} 
        transparent 
        animationType="none" // ✅ SEM animação nativa do modal
        onRequestClose={closeMenu}
        onShow={() => console.log('📱 [MODAL] Modal exibido em:', Date.now())}
        statusBarTranslucent={true} // ✅ Melhora performance no Android
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        >
          {/* ✅ SEM ANIMAÇÃO COMPLEXA - APENAS OPACIDADE */}
          <Animated.View style={[styles.dropdownMenu, { opacity: menuAnimation }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuOption('perfil')} 
              activeOpacity={0.7}
            >
              <User size={20} color="#374151" />
              <Text style={styles.menuItemText}>Perfil</Text>
            </TouchableOpacity>
            
            {userData?.user_type === 'personal_trainer' && (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleMenuOption('configuracoes')} 
                activeOpacity={0.7}
              >
                <Settings size={20} color="#374151" />
                <Text style={styles.menuItemText}>Configurações</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]} 
              onPress={() => handleMenuOption('sair')} 
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sair</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  // Configurações específicas para Android
  const isAndroid = Platform.OS === 'android';
  const minimumBottomPadding = 24;
  const androidExtraSpace = 16;
  
  const bottomPadding = isAndroid 
    ? Math.max(insets.bottom, minimumBottomPadding) + androidExtraSpace
    : Math.max(insets.bottom, minimumBottomPadding);

  const tabBarHeight = 80 + bottomPadding;

  // ✅ CORES TITANS FITNESS - Unificadas para PT e Aluno
  const titansColors = {
    active: '#A11E0A',
    inactive: '#64748B'
  };

  const modernScreenOptions = {
    lazy: false,
    unmountOnBlur: false,
    headerShown: true,
    headerStyle: { 
      backgroundColor: 'white', 
      borderBottomWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 3,
    },
    headerTitleStyle: { 
      fontSize: 18, 
      fontWeight: '700',
      color: '#1F2937',
      letterSpacing: 0.5,
    } as TextStyle,
    headerRight: renderHeaderRight,
    tabBarStyle: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      paddingBottom: bottomPadding,
      paddingTop: 12,
      height: tabBarHeight,
      elevation: 0,
      shadowOpacity: 0,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
      shadowColor: 'transparent',
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    },
    tabBarBackground: () => <ModernTabBarBackground insets={insets} />,
    tabBarLabelStyle: {
      fontSize: 0,
    } as TextStyle,
    tabBarItemStyle: {
      backgroundColor: 'transparent',
      paddingVertical: 6,
      marginHorizontal: 4,
    },
    tabBarShowLabel: false,
  };

  const ptTabs = (
    <Tabs screenOptions={{ 
      ...modernScreenOptions, 
      tabBarActiveTintColor: titansColors.active, 
      tabBarInactiveTintColor: titansColors.inactive 
    }}>
      <Tabs.Screen 
        name="index-pt" 
        options={{ 
          title: 'Inicial', 
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Home} 
              color={color} 
              size={size} 
              focused={focused}
              label="Inicial"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Inicial" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="exercicios" 
        options={{ 
          title: 'Exercícios', 
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Dumbbell} 
              color={color} 
              size={size} 
              focused={focused}
              label="Exercícios"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Exercícios" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="alunos" 
        options={{ 
          title: 'Alunos',
          headerLeft: renderAlunosHeaderLeft,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Users} 
              color={color} 
              size={size} 
              focused={focused}
              label="Alunos"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Alunos" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen name="index-aluno" options={{ href: null }} />
      <Tabs.Screen name="meus-treinos" options={{ href: null }} />
      <Tabs.Screen name="progresso" options={{ href: null }} />
    </Tabs>
  );

  const alunoTabs = (
    <Tabs screenOptions={{ 
      ...modernScreenOptions, 
      tabBarActiveTintColor: titansColors.active, 
      tabBarInactiveTintColor: titansColors.inactive 
    }}>
      <Tabs.Screen 
        name="index-aluno" 
        options={{ 
          title: 'Início', 
          headerTitle: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Home} 
              color={color} 
              size={size} 
              focused={focused}
              label="Início"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Início" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="meus-treinos" 
        options={{ 
          title: 'Meus Treinos', 
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Dumbbell} 
              color={color} 
              size={size} 
              focused={focused}
              label="Treinos"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Treinos" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="progresso" 
        options={{ 
          title: 'Progresso', 
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={TrendingUp} 
              color={color} 
              size={size} 
              focused={focused}
              label="Progresso"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel 
              label="Progresso" 
              focused={focused} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen name="index-pt" options={{ href: null }} />
      <Tabs.Screen name="exercicios" options={{ href: null }} />
      <Tabs.Screen name="alunos" options={{ href: null }} />
    </Tabs>
  );

  return (
    <View style={{ flex: 1 }}>
      {userData.user_type === 'aluno' ? alunoTabs : ptTabs}
      {renderDropdownMenu()}
      <StatusInfoModal visible={modals.statusInfo} onClose={() => closeModal('statusInfo')} />
      {toastVisible && (
        <View style={[styles.toast, { bottom: tabBarHeight + 20 }]}> 
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

// ✅ ESTILOS PARA O FAST AVATAR
const fastAvatarStyles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#60A5FA',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  loadingText: { fontSize: 16, color: '#666' },
  headerRightContainer: { marginRight: 16 },
  headerLeftContainer: { marginLeft: 16 },
  infoButton: { padding: 8 },
  avatarButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  avatarImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  avatarText: { fontSize: 16, fontWeight: '600' },
  chevron: { marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 95, paddingRight: 16 },
  dropdownMenu: { backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuItemText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  menuItemDanger: {},
  menuItemTextDanger: { color: '#EF4444' },
  menuDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4, marginHorizontal: 12 },
  toast: { position: 'absolute', left: 20, right: 20, backgroundColor: '#A11E0A', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
  toastText: { color: 'white', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});