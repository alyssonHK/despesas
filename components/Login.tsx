import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // LOG: Mostra os dados enviados (masculando parte da senha)
        console.log('Tentando autenticar:', { email, senha: password ? password.slice(0,2) + '***' : '' });

        try {
            if (isLogin) {
                console.log('Modo: LOGIN');
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Login bem-sucedido');
            } else {
                console.log('Modo: REGISTRO');
                await createUserWithEmailAndPassword(auth, email, password);
                console.log('Registro bem-sucedido');
            }
        } catch (err: any) {
            // LOG: Mostra o erro completo do Firebase
            console.error('Erro Firebase:', err);
            // Simplifica a mensagem de erro para o usuário
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('E-mail ou senha inválidos.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está em uso.');
            } else if (err.code === 'auth/weak-password') {
                 setError('A senha deve ter pelo menos 6 caracteres.');
            }
            else {
                setError('Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setLoading(false);
            console.log('Finalizou handleSubmit');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
            <div className="w-full max-w-md bg-dark-card p-8 rounded-2xl shadow-lg border border-dark-border">
                <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                    Bem-vindo!
                </h1>
                <p className="text-center text-dark-text-secondary mb-8">
                    {isLogin ? 'Faça login para acessar seu painel.' : 'Crie uma conta para começar a gerenciar.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dark-text-secondary mb-1">E-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-dark-text-secondary mb-1">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                             placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Registrar')}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-brand-primary hover:underline">
                        {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Faça login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
