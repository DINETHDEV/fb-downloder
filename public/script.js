async function downloadVideo() {
    const fbUrl = document.getElementById('fbUrl').value;
    const resultContainer = document.getElementById('result');
    const loaderElement = document.getElementById('loader');
    const errorElement = document.getElementById('errorMessage');
    const downloadBtn = document.getElementById('downloadBtn');

    if (!fbUrl) {
      // Show animated input shake
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
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      const data = await fetchVideoData(fbUrl);

      // Hide loader
      loaderElement.style.display = 'none';
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';

      if (data && data.results) {
        // Display the success animation
        const successElement = document.createElement('div');
        successElement.className = 'success-checkmark';
        successElement.innerHTML = '<div class="check-icon"></div>';
        resultContainer.appendChild(successElement);
        successElement.style.display = 'flex';
        
        // Display the video info and download options with the /download endpoint
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        resultCard.innerHTML = `
          <img src="${data.results.thumbnail}" alt="Video Thumbnail" class="thumbnail">
          <div class="video-info">
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
        // Show error message
        errorElement.style.display = 'block';
      }
    } catch (error) {
      // Hide loader and show error
      loaderElement.style.display = 'none';
      errorElement.style.display = 'block';
      document.getElementById('errorText').textContent = 'Error: ' + (error.message || 'Failed to fetch video data');
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';
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
  
  // Keypress event for Enter key
  document.getElementById('fbUrl').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      document.getElementById('downloadBtn').click();
    }
  });