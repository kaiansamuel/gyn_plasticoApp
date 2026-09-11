import { Button } from './Button';
import styles from './LoadMoreButton.module.css';

type Props = {
  loading: boolean;
  loadedCount: number;
  onLoadMore: () => void;
  totalCount: number;
};

export function LoadMoreButton({ loading, loadedCount, onLoadMore, totalCount }: Props) {
  return (
    <div className={styles.footer}>
      <p className={styles.count}>Exibindo {loadedCount} de {totalCount}</p>
      {loadedCount < totalCount ? (
        <Button loading={loading} onClick={onLoadMore} type="button" variant="outline">
          Carregar mais
        </Button>
      ) : null}
    </div>
  );
}
