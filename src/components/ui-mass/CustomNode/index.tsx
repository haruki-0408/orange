// ... 既存のimports
import Image from 'next/image';

// ... 既存のコード

<div className={styles.header}>
  {data.icon && (
    <div className={styles.icon}>
      <Image
        src={data.icon}
        alt={data.serviceType}
        width={24}
        height={24}
      />
    </div>
  )}
  <div className={styles.titleArea}>
    <h3 className={styles.title}>{data.title}</h3>
    <p className={styles.description}>{data.description}</p>
  </div>
</div>