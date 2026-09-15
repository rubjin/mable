document.addEventListener('DOMContentLoaded', () => {

    const searchURL = new URL(location.href).searchParams;
    const mode = searchURL.get('d');

    const isDark = {
        Dark: () => navigator.userAgent.match(/m-able_dark/i) !== null
    };

    const setThemeAttribute = theme => {
        document.documentElement.setAttribute('data-theme', theme);
        console.log(theme);
    };

    /* html img src 변경 */
    const imgURL = imgSrc => {
        const $imgSelect = document.querySelectorAll('img');
        if (imgSrc == 'dark') {
            $imgSelect.forEach(img => {
                const imgSrc = img.getAttribute('src');
                const imgReplace = imgSrc.replace('/images/', '/images_dark/');
                img.setAttribute('src', imgReplace);
            });
        }
    };

    /* lottie data-lottie 변경 */
    const lottieURL = lottieSrc => {
        const $lottieSelect = document.querySelectorAll('[data-lottie]');
        if (lottieSrc == 'dark') {
            $lottieSelect.forEach(el => {
                const src = el.getAttribute('data-lottie');
                const replace = src.replace('/mableLottie/web/', '/mableLottie/web_dark/');
                el.setAttribute('data-lottie', replace);
            });
        }
    };

    const bodyClassList = document.body.classList;

    if (isDark.Dark() || mode !== null) {
        // 다크모드
        if (bodyClassList.contains('onlyLight')) {
            setThemeAttribute('light');
        } else {
            setThemeAttribute('dark');
            imgURL('dark');
            lottieURL('dark');
        }
    } else {
        // 라이트모드
        setThemeAttribute('light');
    }

	// if(isDark.Dark() || mode!==null) { 
	// 	// 다크모드
	// 	setThemeAttribute('dark');
	// 	imgURL('dark');

	// } else { // 라이트모드
	// 	setThemeAttribute('light');  
	// }

});
