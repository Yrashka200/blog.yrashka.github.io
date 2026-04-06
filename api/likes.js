import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Настройки CORS для работы с разных доменов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { postId } = req.query;
  
  if (!postId) {
    return res.status(400).json({ error: 'postId is required' });
  }
  
  const likeKey = `post:${postId}:likes`;
  const dislikeKey = `post:${postId}:dislikes`;
  const userVotesKey = `post:${postId}:userVotes`;
  
  // GET - получить текущие лайки/дизлайки
  if (req.method === 'GET') {
    try {
      const likes = await kv.get(likeKey) || 0;
      const dislikes = await kv.get(dislikeKey) || 0;
      return res.status(200).json({ likes, dislikes });
    } catch (error) {
      console.error('Error fetching likes:', error);
      return res.status(500).json({ error: 'Failed to fetch likes' });
    }
  }
  
  // POST - проголосовать
  if (req.method === 'POST') {
    const { voteType } = req.body; // 'like' или 'dislike'
    
    // Получаем IP для идентификации пользователя (простейший способ)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userVoteKey = `${userVotesKey}:${userIp}`;
    
    try {
      // Проверяем, голосовал ли уже пользователь
      const existingVote = await kv.get(userVoteKey);
      
      if (existingVote === voteType) {
        // Отмена голоса
        if (voteType === 'like') {
          await kv.decr(likeKey);
        } else {
          await kv.decr(dislikeKey);
        }
        await kv.del(userVoteKey);
        
        const likes = await kv.get(likeKey) || 0;
        const dislikes = await kv.get(dislikeKey) || 0;
        return res.status(200).json({ likes, dislikes, userVote: null });
      } else if (existingVote && existingVote !== voteType) {
        // Смена голоса
        if (voteType === 'like') {
          await kv.incr(likeKey);
          await kv.decr(dislikeKey);
        } else {
          await kv.incr(dislikeKey);
          await kv.decr(likeKey);
        }
        await kv.set(userVoteKey, voteType);
        
        const likes = await kv.get(likeKey) || 0;
        const dislikes = await kv.get(dislikeKey) || 0;
        return res.status(200).json({ likes, dislikes, userVote: voteType });
      } else {
        // Новый голос
        if (voteType === 'like') {
          await kv.incr(likeKey);
        } else {
          await kv.incr(dislikeKey);
        }
        await kv.set(userVoteKey, voteType);
        
        const likes = await kv.get(likeKey) || 0;
        const dislikes = await kv.get(dislikeKey) || 0;
        return res.status(200).json({ likes, dislikes, userVote: voteType });
      }
    } catch (error) {
      console.error('Error processing vote:', error);
      return res.status(500).json({ error: 'Failed to process vote' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}