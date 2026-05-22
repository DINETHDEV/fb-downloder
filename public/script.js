async function downloadVideo() {
  const fbUrl = document.getElementById('fbUrl').value.trim();
  const resultContainer = document.getElementById('result');
  const loaderElement = document.getElementById('loader');
  const errorElement = document.getElementById('errorMessage');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!fbUrl) {
    // Shake animation on empty input
    const inputElement = document.getElementById('fbUrl');
    inputElement.style.animation = 'shake 0.5s';
    setTimeout(() => {
      inputElement.style.animation = '';
    }, 500);
    return;
  }

  // Clear previous result and show loader
  resultContainer.innerHTML = '';
  resultContainer.classList.remove('active');
  errorElement.style.display = 'none';
  loaderElement.style.display = 'block';
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = '<span class="btn-content"><i class="fas fa-spinner fa-spin"></i> Processing...</span><div class="btn-glow"></div>';

  try {
    const data = await fetchVideoData(fbUrl);

    // Hide loader
    loaderElement.style.display = 'none';
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span class="btn-content"><i class="fas fa-cloud-download-alt"></i> Download Video</span><div class="btn-glow"></div>';

    if (data && data.results) {
      // Build result card with success badge inside
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';

      resultCard.innerHTML = `
        <img src="${data.results.thumbnail}" alt="Video Thumbnail" class="thumbnail">
        <div class="video-info">
          <div class="success-badge">
            <i class="fas fa-circle-check"></i>
            <span>Video found successfully!</span>
          </div>
          <h3>${data.results.title}</h3>
          <div class="download-options">
            <a href="/download?url=${encodeURIComponent(data.results.quality.sd)}&quality=sd&filename=facebook_video_sd">
              <div class="quality-btn sd-btn">
                <i class="fas fa-file-video"></i> Download SD
              </div>
            </a>
            <a href="/download?url=${encodeURIComponent(data.results.quality.hd)}&quality=hd&filename=facebook_video_hd">
              <div class="quality-btn hd-btn">
                <i class="fas fa-file-video"></i> Download HD
              </div>
            </a>
          </div>
        </div>
      `;

      resultContainer.appendChild(resultCard);
      resultContainer.classList.add('active');
    } else {
      errorElement.style.display = 'block';
      document.getElementById('errorText').textContent = 'Could not fetch video. Make sure the video is public.';
    }
  } catch (error) {
    loaderElement.style.display = 'none';
    errorElement.style.display = 'block';
    const errData = error.response?.data;
    let errMsg = errData?.details || errData?.error || error.message || 'Failed to fetch video data';
    if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
    document.getElementById('errorText').textContent = 'Error: ' + errMsg;
    if (errData?.help) {
      const helpDiv = document.createElement('div');
      helpDiv.className = 'help-box';
      helpDiv.innerHTML = '<hr style="margin:12px 0;opacity:0.2"><strong>Need cookies?</strong><br>' +
        errData.help.instructions.replace(/\n/g, '<br>');
      document.getElementById('errorText').appendChild(helpDiv);
    }
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span class="btn-content"><i class="fas fa-cloud-download-alt"></i> Download Video</span><div class="btn-glow"></div>';
  }
}

async function fetchVideoData(fbUrl) {
  try {
    const response = await axios.get(`/fbdown?url=${encodeURIComponent(fbUrl)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching video data:', error);
    throw error;
  }
}

// Enter key support
document.getElementById('fbUrl').addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    document.getElementById('downloadBtn').click();
  }
});