import type { Filial } from '../schemas/filial.schema';
import styles from './FilialSelect.module.css';

type FilialSelectProps = {
  filiais: Filial[];
  value: number | undefined;
  onChange: (value: number) => void;
  isLoading: boolean;
  isError: boolean;
  error?: string;
};

export function FilialSelect({ filiais, value, onChange, isLoading, isError, error }: FilialSelectProps) {
  const disabled = isLoading || isError || filiais.length === 0;
  const helperText = isLoading
    ? 'Carregando filiais…'
    : isError
      ? 'Não foi possível carregar as filiais.'
      : filiais.length === 0
        ? 'Nenhuma filial disponível.'
        : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="filial">
        Filial
      </label>
      <select
        id="filial"
        className={`${styles.select} ${error ? styles.hasError : ''}`}
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="" disabled>
          Selecione uma filial
        </option>
        {filiais.map((filial) => (
          <option key={filial.codigo} value={filial.codigo}>
            {filial.codigo} · {filial.nome}
          </option>
        ))}
      </select>
      {error ? <span className={styles.errorText}>{error}</span> : null}
      {!error && helperText ? <span className={styles.helperText}>{helperText}</span> : null}
    </div>
  );
}
