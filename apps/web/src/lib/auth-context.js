"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
exports.AuthProvider = AuthProvider;
// apps/web/src/lib/auth-context.tsx
const react_1 = require("react");
const supabase_1 = require("./supabase");
const AuthContext = (0, react_1.createContext)({
    user: null,
    session: null,
    loading: true,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => { },
    token: null,
});
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [session, setSession] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const supabase = (0, supabase_1.createClient)();
    (0, react_1.useEffect)(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };
    const signOut = async () => {
        await supabase.auth.signOut();
    };
    return (<AuthContext.Provider value={{
            user,
            session,
            loading,
            signIn,
            signUp,
            signOut,
            token: session?.access_token ?? null,
        }}>
      {children}
    </AuthContext.Provider>);
}
const useAuth = () => (0, react_1.useContext)(AuthContext);
exports.useAuth = useAuth;
