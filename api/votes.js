// Modern Like/Dislike functionality
class VoteManager {
  constructor(postId) {
    this.postId = postId;
    this.likes = 0;
    this.dislikes = 0;
    this.userVote = null;
    this.init();
  }
  
  async init() {
    await this.fetchVotes();
    this.renderButtons();
  }
  
  async fetchVotes() {
    try {
      const response = await fetch(`/api/likes?postId=${this.postId}`);
      const data = await response.json();
      this.likes = data.likes || 0;
      this.dislikes = data.dislikes || 0;
      this.userVote = data.userVote || null;
    } catch (error) {
      console.error('Error fetching votes:', error);
      // Fallback to localStorage if API fails
      this.loadFromLocalStorage();
    }
  }
  
  loadFromLocalStorage() {
    const key = `post_${this.postId}_votes`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      this.likes = data.likes || 0;
      this.dislikes = data.dislikes || 0;
      this.userVote = data.userVote || null;
    }
  }
  
  saveToLocalStorage() {
    const key = `post_${this.postId}_votes`;
    localStorage.setItem(key, JSON.stringify({
      likes: this.likes,
      dislikes: this.dislikes,
      userVote: this.userVote
    }));
  }
  
  async vote(voteType) {
    try {
      const response = await fetch(`/api/likes?postId=${this.postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      });
      
      const data = await response.json();
      this.likes = data.likes;
      this.dislikes = data.dislikes;
      this.userVote = data.userVote;
    } catch (error) {
      // Fallback to localStorage if API fails
      console.error('Error voting, using localStorage fallback:', error);
      
      if (this.userVote === voteType) {
        // Remove vote
        if (voteType === 'like') this.likes--;
        else this.dislikes--;
        this.userVote = null;
      } else if (this.userVote && this.userVote !== voteType) {
        // Change vote
        if (voteType === 'like') {
          this.likes++;
          this.dislikes--;
        } else {
          this.dislikes++;
          this.likes--;
        }
        this.userVote = voteType;
      } else {
        // New vote
        if (voteType === 'like') this.likes++;
        else this.dislikes++;
        this.userVote = voteType;
      }
      
      this.saveToLocalStorage();
    }
    
    this.renderButtons();
  }
  
  renderButtons() {
    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    const likeCount = document.getElementById('like-count');
    const dislikeCount = document.getElementById('dislike-count');
    const totalSpan = document.getElementById('total-votes');
    const voteStatus = document.getElementById('vote-status');
    
    // Update like button active state
    if (likeBtn) {
      if (this.userVote === 'like') {
        likeBtn.classList.add('active');
      } else {
        likeBtn.classList.remove('active');
      }
    }
    
    // Update dislike button active state
    if (dislikeBtn) {
      if (this.userVote === 'dislike') {
        dislikeBtn.classList.add('active');
      } else {
        dislikeBtn.classList.remove('active');
      }
    }
    
    // Update like count
    if (likeCount) {
      likeCount.textContent = this.likes;
    }
    
    // Update dislike count
    if (dislikeCount) {
      dislikeCount.textContent = this.dislikes;
    }
    
    // Update total votes
    if (totalSpan) {
      totalSpan.textContent = this.likes + this.dislikes;
    }
    
    // Update status message
    if (voteStatus) {
      if (this.userVote === 'like') {
        voteStatus.innerHTML = '💜 Thanks for your support! You liked this post.';
      } else if (this.userVote === 'dislike') {
        voteStatus.innerHTML = '📝 Thanks for your feedback! You disliked this post.';
      } else {
        const messages = [
          '✨ What do you think about this post?',
          '💭 Share your opinion!',
          '👍👎 Like or dislike?',
          '📢 Your feedback matters!',
          '💡 Did you find this helpful?',
          '🌟 Your vote helps others!',
          '🤔 What are your thoughts?',
          '💬 Let me know what you think!'
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        voteStatus.innerHTML = randomMsg;
      }
    }
    
    // Animate count changes (optional)
    this.animateCounts();
  }
  
  animateCounts() {
    const likeCount = document.getElementById('like-count');
    const dislikeCount = document.getElementById('dislike-count');
    
    if (likeCount) {
      likeCount.style.transform = 'scale(1.1)';
      setTimeout(() => {
        if (likeCount) likeCount.style.transform = '';
      }, 200);
    }
    
    if (dislikeCount) {
      dislikeCount.style.transform = 'scale(1.1)';
      setTimeout(() => {
        if (dislikeCount) dislikeCount.style.transform = '';
      }, 200);
    }
  }
  
  resetVotes() {
    if (confirm('Are you sure you want to reset all votes for this post?')) {
      this.likes = 0;
      this.dislikes = 0;
      this.userVote = null;
      this.saveToLocalStorage();
      this.renderButtons();
      
      // Show temporary success message
      const status = document.getElementById('vote-status');
      if (status) {
        const originalMsg = status.innerHTML;
        status.innerHTML = '✨ Votes have been reset! ✨';
        status.style.opacity = '1';
        setTimeout(() => {
          status.innerHTML = originalMsg;
          status.style.opacity = '';
        }, 2000);
      }
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const voteContainer = document.getElementById('vote-container');
  if (voteContainer) {
    const postId = voteContainer.dataset.postId;
    const voteManager = new VoteManager(postId);
    
    // Make functions available globally
    window.voteLike = () => voteManager.vote('like');
    window.voteDislike = () => voteManager.vote('dislike');
    window.resetVotes = () => voteManager.resetVotes();
  }
});

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Press 'l' for like, 'd' for dislike
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    if (typeof voteLike === 'function') voteLike();
  } else if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    if (typeof voteDislike === 'function') voteDislike();
  }
});

// Optional: Add tooltips to show keyboard shortcuts
const addTooltips = () => {
  const likeBtn = document.getElementById('like-btn');
  const dislikeBtn = document.getElementById('dislike-btn');
  
  if (likeBtn && !likeBtn.hasAttribute('title')) {
    likeBtn.setAttribute('title', 'Like (press L)');
  }
  if (dislikeBtn && !dislikeBtn.hasAttribute('title')) {
    dislikeBtn.setAttribute('title', 'Dislike (press D)');
  }
};

// Add tooltips after a short delay
setTimeout(addTooltips, 1000);