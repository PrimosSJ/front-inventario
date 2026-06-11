import { useState } from 'react';
import { useAuth } from './authContext';
import { motion, AnimatePresence } from "framer-motion";

const LoginForm = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [passwordVisible, setPasswordVisible] = useState(false)

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
					</fieldset>
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Contraseña</legend>
						<div className="join input input-bordered p-0 items-center w-full flex">
							<label className="flex px-4 items-center gap-2 join-item flex-1 rounded-r-none">
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
									type={passwordVisible ? 'text' : 'password'}
									required
									placeholder={passwordVisible ? "abcd1234" : "••••••••"}
									className="w-full [*::-webkit-credentials-reveal]:hidden [*::-webkit-password-toggle-button]:hidden [*::-ms-reveal]:hidden"
									autoComplete="current-password"
									data-1p-ignore
									value={password}
									onFocus={() => setError('')}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</label>
							<button
								type="button"
								onClick={() => setPasswordVisible((prev) => !prev)}
								className="btn btn-neutral join-item rounded-l-none px-3"
								aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
								title={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
							>
								{passwordVisible ? (
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
										<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
									</svg>
								)}
							</button>
						</div>
					</fieldset>

					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary w-full"
					>
						{loading && <span className="loading loading-spinner"></span>}
						<span>{loading ? 'Accediendo...' : 'Acceder'}</span>
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