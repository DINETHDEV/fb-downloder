import sys, json, os
from yt_dlp import YoutubeDL

def download(url):
    cookies_file = os.path.join(os.path.dirname(__file__), 'cookies.txt')
    
    opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'dump_single_json': True,
        'no_check_certificates': True,
    }
    
    if os.path.exists(cookies_file):
        opts['cookiefile'] = cookies_file
    
    try:
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {'error': 'No video info extracted'}
            
            formats = info.get('formats', [])
            thumbnails = info.get('thumbnails', [])
            thumbnail = ''
            if thumbnails:
                thumbnail = thumbnails[0].get('url', '')
            
            hd_url = ''
            sd_url = ''
            
            for f in formats:
                f_url = f.get('url', '')
                height = f.get('height', 0) or 0
                if height >= 720 and not hd_url:
                    hd_url = f_url
                elif height < 720 and not sd_url:
                    sd_url = f_url
            
            if not hd_url and formats:
                hd_url = formats[0].get('url', '')
            
            return {
                'results': {
                    'title': info.get('title', 'Facebook Video'),
                    'thumbnail': thumbnail,
                    'quality': {
                        'sd': sd_url or hd_url,
                        'hd': hd_url
                    }
                }
            }
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else ''
    if not url:
        print(json.dumps({'error': 'No URL provided'}))
    else:
        result = download(url)
        print(json.dumps(result))
