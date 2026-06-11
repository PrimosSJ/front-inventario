import { useState } from 'react';
import { useAuth } from './authContext';
import { motion, AnimatePresence } from "framer-motion";

const LoginForm = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const { login } = useAuth()

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		const result = await login(email, password)
		if (!result.success) {
			setError(result.message || 'Login failed')
		}
		setLoading(false)
	}

	return (
		<main className="flex-1 w-full flex flex-col items-center justify-center px-4 mb-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="text-2xl font-extrabold tracking-tight">
						Bienvenid@
					</h2>
					<p>
						Accede a tu cuenta para gestionar el inventario de PrimosSJ.
					</p>
				</div>

				<form className="space-y-4 *:space-y-1" onSubmit={handleSubmit}>
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Correo eléctronico</legend>
						<label className="input input-bordered flex items-center gap-2 validator">
							<svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<g
									strokeLinejoin="round"
									strokeLinecap="round"
									strokeWidth="2.5"
									fill="none"
									stroke="currentColor"
								>
									<rect width="20" height="16" x="2" y="4" rx="2"></rect>
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
								</g>
							</svg>
							<input
								type="email"
								className="w-full"
								placeholder="primo@correo.com"
								value={email}
								autoComplete="email"
								autoFocus
								onFocus={() => setError('')}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</label>
						<div className="validator-hint hidden">Enter valid email address</div>
					</fieldset>
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Contraseña</legend>
						<label className="input input-bordered flex items-center gap-2">
							<svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<g
									strokeLinejoin="round"
									strokeLinecap="round"
									strokeWidth="2.5"
									fill="none"
									stroke="currentColor"
								>
									<path
										d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
									></path>
									<circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
								</g>
							</svg>
							<input
								type="password"
								required
								placeholder="••••••••"
								className="w-full"
								autoComplete="current-password"
								value={password}
								onFocus={() => setError('')}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</label>
					</fieldset>

					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary w-full"
					>
						{loading && <span className="loading loading-spinner"></span>}
						<span>{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
					</button>

					<AnimatePresence>
						{error && (
							<motion.div
								initial={{ height: 0, opacity: 0, overflow: "hidden" }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2, ease: "easeInOut" }}
							>
								<div role="alert" className="alert alert-error">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<div>
										<h3 className="font-bold">Error</h3>
										<div className="text-xs">{error}</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</form>
			</div>
		</main>
	);
};

export default LoginForm;