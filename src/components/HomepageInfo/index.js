import styles from './styles.module.scss';

const socialData = {
    img: 'img/icons/rikka_ssss_pixel_art.png',
    title: 'Social Channels',
    links: {
        bilibili: { url: 'https://space.bilibili.com/373512714', icon: 'img/pixel_icon/payment.png' },
        github: { url: 'https://github.com/rcxxx', icon: 'img/pixel_icon/star.png' },
        qq: { icon: 'img/pixel_icon/target.png', qr: 'https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/qr-code/qq.jpg' },
        wechat: { icon: 'img/pixel_icon/users.png', qr: 'https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/qr-code/wechat.jpg' },
    },
};

function GameBoy({img}) {
    return (
        <div className={styles.gameboy}>
            <div className={styles.body}></div>
            <div className={styles['screen-box']}>
                <div className={styles.decorate}></div>
                <div className={styles.screen}>
                    <img src={img} alt="" />
                </div>
            </div>
            <div className={styles.lights}></div>
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

function SocialIcon({className, href, icon, qr}) {
    const hasQr = !!qr;
    return (
        <div className={className}>
            <a href={href || undefined} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}>
                <img src={icon} alt="" />
                {hasQr && <img src={qr} className={styles.qrPopup} alt="QR Code" />}
            </a>
        </div>
    );
}

export default function HomepageInfo() {
    const {links, img, title} = socialData;
    return (
        <div className={styles['info-container']}>
            <div className={styles.card}>
                <div className={styles.back}></div>
                <div className={styles.zoom}>
                    <GameBoy img={img} />
                </div>
                <div className={styles.content}>
                    <h2>{title}</h2>
                    <div className={styles['social-icons']}>
                        <div className={styles['icons-top']}>
                            <SocialIcon className={styles['icon-t']} href={links.bilibili.url} icon={links.bilibili.icon} />
                            <SocialIcon className={styles['icon-l']} href={links.github.url} icon={links.github.icon} />
                        </div>
                        <div className={styles['icons-back']}>
                            <SocialIcon className={styles['icon-r']} icon={links.qq.icon} qr={links.qq.qr} />
                            <SocialIcon className={styles['icon-b']} icon={links.wechat.icon} qr={links.wechat.qr} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
