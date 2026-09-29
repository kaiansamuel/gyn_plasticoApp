import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { FilialSelect } from '../components/FilialSelect';
import { useFiliais } from '../hooks/useFiliais';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { ApiError } from '../api/client';
import { loginFormSchema, type LoginFormValues } from '../schemas/auth.schema';
import styles from './LoginScreen.module.css';

type FormBanner = { tone: 'danger' | 'warning'; message: string };

export function LoginScreen() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const filiaisQuery = useFiliais();
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [banner, setBanner] = useState<FormBanner | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { login: '', senha: '', filial: undefined },
  });

  const [watchedLogin, watchedSenha, watchedFilial] = useWatch({
    control,
    name: ['login', 'senha', 'filial'],
  });
  const canSubmit = Boolean(watchedLogin) && Boolean(watchedSenha) && Boolean(watchedFilial);

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    setBanner(null);
    loginMutation.mutate(values, {
      onSuccess: () => navigate('/'),
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          setBanner({ tone: 'danger', message: 'Não foi possível entrar. Tente novamente.' });
          return;
        }

        if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
          for (const detail of error.details) {
            if (detail.field === 'login' || detail.field === 'senha' || detail.field === 'filial') {
              setError(detail.field, { type: 'server', message: detail.message });
            }
          }
          return;
        }

        if (error.statusCode === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
          setBanner({
            tone: 'warning',
            message: 'Muitas tentativas de login. Aguarde 1 minuto e tente novamente.',
          });
          return;
        }

        if (error.statusCode === 401) {
          setBanner({ tone: 'danger', message: 'Usuário, senha ou filial inválidos.' });
          return;
        }

        setBanner({ tone: 'danger', message: error.message || 'Não foi possível entrar. Tente novamente.' });
      },
    });
  });

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>GP</span>
        <p className={styles.brandName}>Gyn Plástico</p>
        <p className={styles.brandTagline}>Acesso seguro ao seu ERP</p>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>Entrar</p>
        <p className={styles.cardSubtitle}>Entre com seu usuário e senha.</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          {banner ? (
            <div className={`${styles.banner} ${banner.tone === 'warning' ? styles.bannerWarning : styles.bannerDanger}`}>
              {banner.message}
            </div>
          ) : null}

          <Controller
            control={control}
            name="login"
            render={({ field }) => (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login">
                  Usuário
                </label>
                <input
                  {...field}
                  id="login"
                  type="text"
                  autoComplete="username"
                  placeholder="Digite seu usuário"
                  className={`${styles.input} ${errors.login ? styles.hasError : ''}`}
                />
                {errors.login ? <span className={styles.errorText}>{errors.login.message}</span> : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="senha"
            render={({ field }) => (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="senha">
                  Senha
                </label>
                <div className={styles.inputWrap}>
                  <input
                    {...field}
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className={`${styles.input} ${styles.passwordInput} ${errors.senha ? styles.hasError : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.toggleVisibility}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.senha ? <span className={styles.errorText}>{errors.senha.message}</span> : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="filial"
            render={({ field }) => (
              <FilialSelect
                filiais={filiaisQuery.data ?? []}
                value={field.value}
                onChange={field.onChange}
                isLoading={filiaisQuery.isLoading}
                isError={filiaisQuery.isError}
                error={errors.filial?.message}
              />
            )}
          />

          <button type="submit" className={styles.submitButton} disabled={!canSubmit || loginMutation.isPending}>
            {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
