import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from "framer-motion";

import KeyIcon from '../icons/key.jsx';
import MailIcon from '../icons/mail.jsx';
import EyeOffIcon from '../icons/eye-off.jsx';
import EyeIcon from '../icons/eye.jsx';

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
			<div className='right-0 ml-auto w-1/2 flex justify-center items-center'>
				<div className="max-w-md w-full space-y-8">
					<div className="text-center">
						<h2 className="text-2xl font-extrabold tracking-tight">
							Bienvenid@
						</h2>
						<p>
							Accede a tu cuenta para gestionar el POTO de PrimosSJ.
						</p>
					</div>

					<form className="space-y-4 *:space-y-1" onSubmit={handleSubmit}>
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Correo eléctronico</legend>
							<label className="input input-bordered flex items-center gap-2 validator">
								<MailIcon className="h-[1em] text-base-content/50" />
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
									<KeyIcon className="h-[1em] text-base-content/50" />
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
									className="btn btn-neutral join-item rounded-l-none px-3 text-base-content/50 *:size-5 *:stroke-[2]"
									aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
									title={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
								>
									{passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
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
			</div>

			<img id="background" draggable="false" className='fixed z-[-100] transition-all duration-1000 opacity-100 pointer-events-none select-none mix-blend-screen h-full left-0 bottom-0' src="/background.png" />
		</main>
	);
};

export default LoginForm;