// import { Image } from 'expo-image';
// import { Platform, StyleSheet } from 'react-native';

// import { HelloWave } from '@/components/hello-wave';
// import ParallaxScrollView from '@/components/parallax-scroll-view';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Link } from 'expo-router';

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12',
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <Link href="/modal">
//           <Link.Trigger>
//             <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//           </Link.Trigger>
//           <Link.Preview />
//           <Link.Menu>
//             <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
//             <Link.MenuAction
//               title="Share"
//               icon="square.and.arrow.up"
//               onPress={() => alert('Share pressed')}
//             />
//             <Link.Menu title="More" icon="ellipsis">
//               <Link.MenuAction
//                 title="Delete"
//                 icon="trash"
//                 destructive
//                 onPress={() => alert('Delete pressed')}
//               />
//             </Link.Menu>
//           </Link.Menu>
//         </Link>

//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });



import React, { useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export default function SmartHomeOnboarding() {
  const router = useRouter();

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIconPress = (name: string) => {
    Alert.alert("Thông báo", `Bạn vừa nhấn vào tính năng: ${name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.topSection}>
        
        {/* Icons */}
        <TouchableOpacity
          onPress={() => handleIconPress("Độ ẩm")}
          style={[styles.iconBox, styles.topLeft]}
        >
          <Ionicons name="water" size={28} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Nhiệt độ")}
          style={[styles.iconBox, styles.topRight]}
        >
          <MaterialCommunityIcons name="thermometer" size={28} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Cài đặt")}
          style={[styles.iconBox, styles.bottomLeft]}
        >
          <Ionicons name="settings" size={28} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Ánh sáng")}
          style={[styles.iconBox, styles.bottomRight]}
        >
          <Ionicons name="sunny" size={28} color="#F59E0B" />
        </TouchableOpacity>

        {/* Logo */}
        <Animated.View style={animatedLogoStyle}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons
              name="lightbulb-variant-outline"
              size={100}
              color="white"
            />
            <View style={styles.homeIcon}>
              <Ionicons name="home" size={24} color="white" />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Text */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.smartText}>Smart</Text>
          <Text style={styles.homeText}>Home</Text>
        </View>

        <Text style={styles.description}>
          Hệ thống nhà thông minh{"\n"}
          an toàn - tiết kiệm - tự động
        </Text>
      </View>

      {/* Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  topSection: {
    backgroundColor: '#C6F4AF',
    height: '60%',
    width: '100%',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  iconBox: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    elevation: 3,
  },

  topLeft: {
    top: 64,
    left: 40,
  },

  topRight: {
    top: 64,
    right: 40,
  },

  bottomLeft: {
    bottom: 80,
    left: 40,
  },

  bottomRight: {
    bottom: 80,
    right: 40,
  },

  logoBox: {
    backgroundColor: '#22C55E',
    padding: 32,
    borderRadius: 40,
    elevation: 10,
  },

  homeIcon: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smartText: {
    color: '#22C55E',
    fontSize: 40,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },

  homeText: {
    color: 'black',
    fontSize: 40,
    fontWeight: 'bold',
  },

  description: {
    color: '#22C55E',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
    lineHeight: 24,
  },

  footer: {
    alignItems: 'center',
    paddingBottom: 48,
  },

  button: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 5,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});