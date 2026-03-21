import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from "react-native"
import { supabase } from "../lib/supabase"

type Face = "login" | "register"

export default function AuthScreen() {
  const [face, setFace] = useState<Face>("login")
  const flipAnim = useRef(new Animated.Value(0)).current

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState(false)

  const rotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "90deg", "0deg"],
  })

  function flip(to: Face) {
    Animated.timing(flipAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFace(to)
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => flipAnim.setValue(0))
    })
  }

  async function handleLogin() {
    if (!loginEmail || !loginPassword) { setLoginError("Please fill in all fields."); return }
    setLoginLoading(true); setLoginError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) setLoginError(error.message)
    setLoginLoading(false)
  }

  async function handleGoogleLogin() {
    setLoginError(null)
    const redirectTo = Platform.OS === "web"
      ? (globalThis as any).window?.location?.origin
      : "netto://login"
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })
  }

  async function handleRegister() {
    if (!regName || !regEmail || !regPassword || !regConfirm) { setRegError("Please fill in all fields."); return }
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return }
    if (regPassword.length < 6) { setRegError("Password must be at least 6 characters."); return }
    setRegLoading(true); setRegError(null)
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { full_name: regName } },
    })
    if (error) { setRegError(error.message); setRegLoading(false); return }
    setRegSuccess(true); setRegLoading(false)
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16 }}
        className="bg-background"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ width: "100%", maxWidth: 480, transform: [{ perspective: 1200 }, { rotateY: rotate }] }}>
          <View className="bg-surface rounded-2xl p-8 shadow-md">
          {face === "login" ? (
            <>
              <Text className="text-3xl font-bold text-gray-900 text-center mb-1">Netto</Text>
              <Text className="text-xs text-muted text-center mb-2">net income · rendimento líquido</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">Sign in to your account</Text>

              {loginError && <Text className="text-danger text-xs text-center mb-3">{loginError}</Text>}

              <TouchableOpacity
                className="flex-row items-center justify-center border border-gray-200 rounded-xl p-3 mb-5 gap-2"
                onPress={handleGoogleLogin}
              >
                <Text className="text-base font-bold text-blue-500">G</Text>
                <Text className="text-sm font-semibold text-gray-900">Continue with Google</Text>
              </TouchableOpacity>

              <View className="flex-row items-center mb-5">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-3 text-xs text-muted">or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Email <Text className="text-danger">*</Text>
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 mb-4"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={loginEmail}
                onChangeText={setLoginEmail}
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Password <Text className="text-danger">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 mb-2">
                <TextInput
                  className="flex-1 p-3 text-sm text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showLoginPassword}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
                <TouchableOpacity className="px-3" onPress={() => setShowLoginPassword(!showLoginPassword)}>
                  <Text>{showLoginPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity className="self-start mb-5">
                <Text className="text-xs text-gray-500">Forgot my password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary rounded-xl p-3.5 items-center mb-5"
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white text-base font-bold">Sign In</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity className="items-center" onPress={() => flip("register")}>
                <Text className="text-xs text-gray-500">
                  Don't have an account? <Text className="text-primary font-semibold">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : regSuccess ? (
            <>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Check your email</Text>
              <Text className="text-sm text-gray-500 text-center mb-8">
                We sent a confirmation link to {regEmail}.{"\n"}Click it to activate your account.
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-xl p-3.5 items-center"
                onPress={() => { setRegSuccess(false); flip("login") }}
              >
                <Text className="text-white text-base font-bold">Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-1">Create account</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">Start managing your finances</Text>

              {regError && <Text className="text-danger text-xs text-center mb-3">{regError}</Text>}

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Full name <Text className="text-danger">*</Text>
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 mb-4"
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                value={regName}
                onChangeText={setRegName}
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Email <Text className="text-danger">*</Text>
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 mb-4"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={regEmail}
                onChangeText={setRegEmail}
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Password <Text className="text-danger">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 mb-4">
                <TextInput
                  className="flex-1 p-3 text-sm text-gray-900"
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showRegPassword}
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
                <TouchableOpacity className="px-3" onPress={() => setShowRegPassword(!showRegPassword)}>
                  <Text>{showRegPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Confirm password <Text className="text-danger">*</Text>
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 mb-6"
                placeholder="Repeat your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={regConfirm}
                onChangeText={setRegConfirm}
              />

              <TouchableOpacity
                className="bg-primary rounded-xl p-3.5 items-center mb-5"
                onPress={handleRegister}
                disabled={regLoading}
              >
                {regLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white text-base font-bold">Create Account</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity className="items-center" onPress={() => flip("login")}>
                <Text className="text-xs text-gray-500">
                  Already have an account? <Text className="text-primary font-semibold">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
