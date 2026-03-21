import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from "react-native"
import { supabase } from "../lib/supabase"
import { colors } from "../constants/theme"

type Face = "login" | "register"

export default function AuthScreen() {
  const [face, setFace] = useState<Face>("login")
  const flipAnim = useRef(new Animated.Value(0)).current

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register state
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, { transform: [{ perspective: 1200 }, { rotateY: rotate }] }]}>

          {face === "login" ? (
            <>
              <Text style={styles.title}>Netto</Text>
              <Text style={styles.tagline}>net income · rendimento líquido</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>

              {loginError && <Text style={styles.error}>{loginError}</Text>}

              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={loginEmail}
                onChangeText={setLoginEmail}
              />

              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showLoginPassword}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
                <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showLoginPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot my password</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loginLoading}>
                {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => flip("register")} style={styles.switchLink}>
                <Text style={styles.switchText}>
                  Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : regSuccess ? (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={[styles.subtitle, { marginBottom: 32 }]}>
                We sent a confirmation link to {regEmail}.{"\n"}Click it to activate your account.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => { setRegSuccess(false); flip("login") }}>
                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start managing your finances</Text>

              {regError && <Text style={styles.error}>{regError}</Text>}

              <Text style={styles.label}>Full name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={regName}
                onChangeText={setRegName}
              />

              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={regEmail}
                onChangeText={setRegEmail}
              />

              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showRegPassword}
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
                <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showRegPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { marginBottom: 24 }]}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={regConfirm}
                onChangeText={setRegConfirm}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={regLoading}>
                {regLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => flip("login")} style={styles.switchLink}>
                <Text style={styles.switchText}>
                  Already have an account? <Text style={styles.switchTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: 4 },
  tagline: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginBottom: 24 },
  error: { color: colors.error, fontSize: 13, textAlign: "center", marginBottom: 12 },
  googleButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 13, marginBottom: 20, gap: 10,
  },
  googleIcon: { fontSize: 16, fontWeight: "bold", color: "#4285F4" },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: colors.text },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  required: { color: colors.required },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 13, fontSize: 15, color: colors.text,
    backgroundColor: colors.inputBackground, marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.inputBackground, marginBottom: 8,
  },
  inputInner: { flex: 1, padding: 13, fontSize: 15, color: colors.text },
  eyeButton: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 16 },
  forgotPassword: { alignSelf: "flex-start", marginBottom: 20 },
  forgotPasswordText: { fontSize: 13, color: colors.textSecondary },
  primaryButton: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 14, alignItems: "center", marginBottom: 20,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchLink: { alignItems: "center" },
  switchText: { fontSize: 13, color: colors.textSecondary },
  switchTextBold: { color: colors.primary, fontWeight: "600" },
})
