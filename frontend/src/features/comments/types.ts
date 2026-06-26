export interface CommentAuthor {
  id: string;
  username: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
}
