import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Eye, Share2 } from 'lucide-react';

const ForumDetail: React.FC = () => {
  const [replyText, setReplyText] = useState('');

  const discussion = {
    id: 1,
    title: 'Understanding the Significance of Fasting in Ethiopian Orthodox Tradition',
    author: 'Michael Teshome',
    authorTitle: 'Theology Student',
    authorAvatar: 'MT',
    joinDate: 'Joined 5/1/2023',
    timeAgo: '582 days ago',
    replies: 12,
    views: 245,
    likes: 18,
    content: `Greetings in Christ, fellow students and faculty members.

I've been deeply contemplating the spiritual and theological foundations of fasting periods in our Ethiopian Orthodox tradition, and I believe this would be an excellent topic for our community to discuss together.

As we know, fasting is not merely abstaining from food, but a complete spiritual discipline that involves prayer, contemplation, and acts of charity. In our Orthodox tradition, we observe several major fasting periods throughout the year:

1. **The Great Fast (Hudadi/Lent)** - 55 days before Easter
2. **The Fast of the Apostles** - From the end of Pentecost until June 29
3. **The Fast of the Assumption** - August 1-15
4. **The Christmas Fast** - November 25 to January 6

Each of these periods has its unique spiritual significance and helps prepare us for major feast days. But I'm particularly interested in understanding:

- How does fasting transform our relationship with God?
- What role does community support play during fasting periods?
- How can we maintain the spiritual focus of fasting in our modern educational environment?

I've been reading the writings of the early church fathers on this topic, particularly Saint John Chrysostom's homilies on fasting, and I'm fascinated by how relevant their teachings remain for us today.

What are your thoughts and experiences with Orthodox fasting? How has it shaped your spiritual journey?

Looking forward to a rich discussion!

**Blessings,**
Michael`
  };

  const replies = [
    {
      id: 1,
      author: 'Sarah Kidane',
      authorTitle: 'Student Affairs Director',
      authorAvatar: 'SK',
      timeAgo: '569 days ago',
      likes: 8,
      content: `Thank you for initiating this important discussion, Michael. Your points about the transformative nature of fasting resonate deeply with my own experience. I particularly appreciate your reference to Saint John Chrysostom. In my years of pastoral work, I've observed that students often struggle initially with the discipline of fasting, but those who persevere discover it becomes a source of spiritual strength rather than burden. The key is understanding that fasting is not punitive but preparatory - it prepares our heart to receive God's grace more fully.`
    },
    {
      id: 2,
      author: 'Father Yohannes Mekonnen',
      authorTitle: 'Chaplain & Spiritual Director',
      authorAvatar: 'FY',
      timeAgo: '561 days ago',
      likes: 12,
      content: `Blessed be the Lord! Michael raises excellent questions that go to the heart of Orthodox spiritual practice. From a pastoral perspective, I encourage our students to view fasting as a form of spiritual training, much like physical exercise strengthens the body. The discipline of fasting strengthens our spiritual muscles - our ability to say no to immediate desires in favor of eternal goods. Regarding community support, this is crucial. In our Ethiopian tradition, fasting was never meant to be a solitary practice. We fast together, pray together, and break our fasts together. This communal aspect helps sustain us during difficult moments.`
    },
    {
      id: 3,
      author: 'Ruth Abraham',
      authorTitle: 'Ancient Languages Student',
      authorAvatar: 'RA',
      timeAgo: '560 days ago',
      likes: 6,
      content: `As a first-year student, I found the transition to Orthodox fasting practices challenging but incredibly meaningful. What helped me most was understanding the biblical foundations. When I studied the original Geez texts of our liturgy, I saw how deeply fasting is woven into our worship. The phrase "not darkened or experience" I've started a personal journal during fasting periods to track not just what I eat, but how my prayer life and relationship with Christ changes. The results have been remarkable!`
    }
  ];

  return (
    <div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Discussion Stats */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>📝 12 replies</span>
            <span>👁 245 views</span>
            <span>👍 18 likes</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Original Post */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{discussion.authorAvatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{discussion.author}</h3>
                  <p className="text-sm text-gray-500">{discussion.authorTitle}</p>
                  <p className="text-xs text-gray-400">{discussion.joinDate}</p>
                </div>
                <div className="text-sm text-gray-500">{discussion.timeAgo}</div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">{discussion.title}</h1>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            {discussion.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 whitespace-pre-line">{paragraph}</p>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{discussion.likes}</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{discussion.replies}</span>
              </button>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Reply
            </button>
          </div>
        </div>

        {/* Add Reply Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Reply</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Share your thoughts on this discussion..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Please be respectful and constructive in your responses.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
              Post Reply
            </button>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Replies ({replies.length})</h3>
          <div className="space-y-6">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-xs">{reply.authorAvatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{reply.author}</h4>
                        <p className="text-sm text-gray-500">{reply.authorTitle}</p>
                      </div>
                      <div className="text-sm text-gray-500">{reply.timeAgo}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-700 mb-4">
                  {reply.content}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{reply.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">0</span>
                    </button>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Forum */}
        <div className="text-center">
          <Link 
            to="/forum" 
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForumDetail;