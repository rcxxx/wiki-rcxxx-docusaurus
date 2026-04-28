import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

const FeatureList = [
  {
    title: 'Stack',
    description: '不用心的学习笔记',
    img: 'img/icons/head/lzumi-06.png',
    link: 'docs/',
  },
  {
    title: 'Projects',
    description: '简单搞搞的好玩项目',
    img: 'img/icons/head/re-01.png',
    link: '#',
  },
  {
    title: 'Notes',
    description: '没有内涵的文章摘抄',
    img: 'img/icons/head/C2.png',
    link: '#',
  },
];

function Feature({title, description, img, link}) {
  return (
    <div className={clsx('col col--4', styles['card-box'])}>
      <div className={styles.card}>
        <div className={styles['card-img-box']}>
          <img src={img} alt={title} />
        </div>
        <div className={styles.content}>
          <div className={styles.details}>
            <Heading as="h3">{title}</Heading>
            <div className={styles.description}>
              {description}
            </div>
            <div className={clsx('text--center', styles['card-button'])}>
              <div className={styles.warp}>
                <Link to={link}>
                  <button className={styles.button}>🌈Portal</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
