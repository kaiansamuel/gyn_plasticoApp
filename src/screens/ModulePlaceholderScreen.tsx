import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './ModulePlaceholderScreen.module.css';

type ModulePlaceholderScreenProps = {
  title: string;
};

export function ModulePlaceholderScreen({ title }: ModulePlaceholderScreenProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <ScreenHeader title={title} onBack={() => navigate('/')} />
      <div className={styles.content}>
        <p className={styles.message}>Módulo em desenvolvimento</p>
      </div>
    </div>
  );
}
