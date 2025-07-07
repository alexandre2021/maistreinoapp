import { Tabs, router } from 'expo-router'
import { ChevronDown, Dumbbell, Home, LogOut, Settings, TrendingUp, User, Users } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {
    Animated,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View
} from 'react-native'
import { supabase } from '../../lib/supabase'

interface UserData {
  id: string
  nome_completo: string
  avatar_letter: string
  avatar_color: string
  avatar_type: 'letter' | 'image'
  avatar_image_url: string | null
  user_type: 'personal_trainer' | 'aluno'
}

export default function TabLayout() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuAnimation] = useState(new Animated.Value(0))
  
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  // Esta função agora só carrega os dados do perfil, assumindo que o utilizador já está logado.
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
      }
    } catch (error) {
      console.error('❌ [TABS] Erro ao carregar dados:', error);
    }
  }, []);

  // ✅ CORREÇÃO: Listener de autenticação com dependência correta
  useEffect(() => {
    console.log('🔗 [TABS] Configurando listener de auth...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [TABS] Mudança de auth:', event, session ? 'LOGADO' : 'DESLOGADO');
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 [TABS] Logout detectado - redirecionando para login...');
        setUserData(null); // Limpa dados do usuário
        router.replace('/'); // Redireciona para login
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ [TABS] Login detectado - recarregando dados...');
        loadUserData(); // Recarrega dados do usuário
      }
    });

    return () => {
      console.log('🔌 [TABS] Desconectando listener de auth...');
      subscription.unsubscribe();
    };
  }, [loadUserData]); // ✅ CORREÇÃO: Adiciona loadUserData como dependência

  // ✅ Carrega dados apenas UMA vez
  useEffect(() => {
    loadUserData();
  }, [loadUserData]); // ✅ CORREÇÃO: Adiciona loadUserData como dependência

  const handleLogout = async () => {
    try {
      console.log('🚪 [TABS] Iniciando logout...');
      showToast('Saindo...')
      closeMenu(); // Fecha o menu imediatamente
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [TABS] Erro no logout:', error);
        showToast('Erro ao sair. Tente novamente.');
      } else {
        console.log('✅ [TABS] Logout realizado com sucesso');
        // O listener acima cuidará do redirecionamento
      }
    } catch (error) {
      console.error('💥 [TABS] Erro inesperado no logout:', error);
      showToast('Erro inesperado. Tente novamente.');
    }
  }

  const toggleMenu = () => {
    if (showMenu) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowMenu(false))
    } else {
      setShowMenu(true)
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowMenu(false))
  }

  const handleMenuOption = (option: string) => {
    closeMenu()
    setTimeout(() => {
      switch (option) {
        case 'perfil':
          const profilePath = userData?.user_type === 'personal_trainer' ? '/perfil-pt/perfil-pt' : '/perfil-aluno/perfil-aluno';
          router.push(profilePath);
          break;
        case 'configuracoes':
          showToast('Configurações em desenvolvimento');
          break;
        case 'sair':
          handleLogout();
          break;
      }
    }, 250)
  }

  const renderAvatar = () => {
    if (!userData) {
      return <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]} />;
    }
    if (userData.avatar_type === 'image' && userData.avatar_image_url) {
      return <Image source={{ uri: `${userData.avatar_image_url}?t=${Date.now()}` }} style={styles.avatarImage} />;
    }
    const getTextColor = (bgColor: string) => ['#86EFAC', '#FDE047', '#F3E8FF', '#E5E7EB', '#FED7AA', '#7DD3FC', '#B3F5FC', '#BEF264'].includes(bgColor) ? '#1F2937' : 'white';
    return (
      <View style={[styles.avatar, { backgroundColor: userData.avatar_color }]}>
        <Text style={[styles.avatarText, { color: getTextColor(userData.avatar_color) }]}>{userData.avatar_letter}</Text>
      </View>
    );
  }

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity style={styles.avatarButton} onPress={toggleMenu} activeOpacity={0.7}>
        {renderAvatar()}
        <ChevronDown size={16} color="#64748B" style={[ styles.chevron, { transform: [{ rotate: showMenu ? '180deg' : '0deg' }] } ]} />
      </TouchableOpacity>
    </View>
  )

  const renderDropdownMenu = () => {
    if (!showMenu) return null;
    return (
      <Modal visible={showMenu} transparent animationType="none" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeMenu}>
          <Animated.View style={[ styles.dropdownMenu, { opacity: menuAnimation, transform: [{ translateY: menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }, { scale: menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('perfil')} activeOpacity={0.7}><User size={20} color="#374151" /><Text style={styles.menuItemText}>Perfil</Text></TouchableOpacity>
            {userData?.user_type === 'personal_trainer' && <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('configuracoes')} activeOpacity={0.7}><Settings size={20} color="#374151" /><Text style={styles.menuItemText}>Configurações</Text></TouchableOpacity>}
            <View style={styles.menuDivider} />
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => handleMenuOption('sair')} activeOpacity={0.7}><LogOut size={20} color="#EF4444" /><Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sair</Text></TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  }

  // ✅ Mostra loading se não há dados do usuário
  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  // ✅ Define os estilos com o tipo correto para evitar erros de TypeScript
  const headerTitleStyle: TextStyle = { fontSize: 18, fontWeight: '600', color: '#1F2937' };
  const tabBarLabelStyle: TextStyle = { fontSize: 12, fontWeight: '600', marginTop: 2 };

  const screenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitleStyle: headerTitleStyle,
    headerRight: renderHeaderRight,
    tabBarStyle: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: 8, paddingTop: 8, height: 70 },
    tabBarLabelStyle: tabBarLabelStyle,
  };

  const ptTabs = (
    <Tabs screenOptions={{ ...screenOptions, tabBarActiveTintColor: '#007AFF', tabBarInactiveTintColor: '#6B7280' }}>
      <Tabs.Screen name="index-pt" options={{ title: 'Inicial', tabBarLabel: 'Inicial', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="exercicios" options={{ title: 'Exercícios', tabBarLabel: 'Exercícios', tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} /> }} />
      <Tabs.Screen name="alunos" options={{ title: 'Alunos', tabBarLabel: 'Alunos', tabBarIcon: ({ color, size }) => <Users size={size} color={color} /> }} />
      <Tabs.Screen name="index-aluno" options={{ href: null }} /><Tabs.Screen name="meus-treinos" options={{ href: null }} /><Tabs.Screen name="progresso" options={{ href: null }} />
    </Tabs>
  );

  const alunoTabs = (
    <Tabs screenOptions={{ ...screenOptions, tabBarActiveTintColor: '#3B82F6', tabBarInactiveTintColor: '#6B7280' }}>
      <Tabs.Screen name="index-aluno" options={{ title: 'Início', tabBarLabel: 'Início', headerTitle: 'Início', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="meus-treinos" options={{ title: 'Meus Treinos', tabBarLabel: 'Treinos', tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} /> }} />
      <Tabs.Screen name="progresso" options={{ title: 'Progresso', tabBarLabel: 'Progresso', tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} /> }} />
      <Tabs.Screen name="index-pt" options={{ href: null }} /><Tabs.Screen name="exercicios" options={{ href: null }} /><Tabs.Screen name="alunos" options={{ href: null }} />
    </Tabs>
  );

  return (
    <>
      {userData.user_type === 'aluno' ? alunoTabs : ptTabs}
      {renderDropdownMenu()}
      {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMessage}</Text></View>}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  loadingText: { fontSize: 16, color: '#666' },
  headerRightContainer: { marginRight: 16 },
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
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
  toastText: { color: 'white', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});