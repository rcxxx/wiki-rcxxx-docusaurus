import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.scss';
import useBaseUrl from '@docusaurus/useBaseUrl';

const FeatureList = [
    {
        title: 'Social Channels',
        description: (
            <>
            </>
        ),
        img: 'img/icons/rikka_ssss_pixel_art.png',
        img_github : 'img/pixel_icon/star.png',
        img_bilibili: 'img/pixel_icon/payment.png', 
        img_wechat: 'img/pixel_icon/users.png', 
        img_qq: 'img/pixel_icon/target.png',
    },
];


function GameBoy({img}){
    return(
        <div className={styles['gameboy']}>
        <div className={styles['body']}></div>
        <div className={styles['screen-box']}>
          <div className={styles['decorate']}></div>
          <div className={styles['screen']}>
            <img src={img} />
          </div>
        </div>
        <div className={styles['lights']}></div>
        <div className={styles['buttons-1']}></div>
        <div className={styles['buttons-2']}></div>
        <div className={styles['buttons-2-2']}></div>
        <div className={styles['pad-back']}>
          <div className={styles['pad-top']}></div>
        </div>
        <div className={styles['details-top']}></div>
        <div className={styles['details-back']}>
          <div className={styles['details-r']}></div>
        </div>
      </div>
    );
}

function Personal_Info({title, img, img_github, img_bilibili, img_wechat, img_qq}) {
    return (
      <div className={styles['info-container']}>
        <div className={styles['card']}>
            <div className={styles['back']}></div>
            <div className={styles['zoom']}>
                <GameBoy img={img} />
            </div>
            <div className={styles['content']}>
                <h2>{title}</h2>
                <div className={styles['social-icons']}>
                    <div className={styles['icons-top']}>
                        <div className={styles['icon-t']}>
                            <a href="https://space.bilibili.com/373512714" target="_blank">
                                <img src={img_bilibili} />
                            </a>
                        </div>
                        <div className={styles['icon-l']}>
                            <a href="https://github.com/rcxxx" target="_blank">
                                <img src={img_github} />
                            </a>
                        </div>
                    </div>
                    <div className={styles['icons-back']}>
                        <div className={styles['icon-r']}>
                            <a>
                                <img src={img_qq} />
                                <img src={useBaseUrl("https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/qr-code/qq.jpg")}
                                    className={`dropdown__menu ${styles.dropdown__menu}`}
                                    />
                            </a>
                        </div>
                        <div className={styles['icon-b']}>
                            <a>
                                <img src={img_wechat} />
                                <img 
                                    src={useBaseUrl("https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/qr-code/wechat.jpg")}
                                    className={`dropdown__menu ${styles.dropdown__menu}`}
                                    />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

export default function HomepageInfo() {
    return (
        <div>
            {FeatureList.map((props, idx) => (
                <Personal_Info key={idx} {...props}/>
            ))}
        </div>
    );
}