import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forumApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import VipAvatar from "@/components/VipAvatar";
import { Heart, MessageSquare, ArrowLeft, Send, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const [commentContent, setCommentContent] = useState("");

  // Fetch post details & comments
  const { data: postResponse, isLoading, error } = useQuery({
    queryKey: ["forumPostDetail", id],
    queryFn: () => forumApi.getPostById(id || ""),
    enabled: !!id,
  });

  const post = postResponse?.data.data?.post;
  const comments = postResponse?.data.data?.comments || [];

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: (postId: string) => forumApi.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPostDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      forumApi.createComment(postId, content),
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["forumPostDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast({
        title: "Bình luận thành công!",
        description: "Bình luận của bạn đã được thêm vào bài viết.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi bình luận",
        description: err.response?.data?.error?.message || "Vui lòng nhập lại bình luận.",
      });
    },
  });

  const handleLike = () => {
    if (!post) return;
    likeMutation.mutate(post._id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu nội dung",
        description: "Vui lòng gõ nội dung bình luận.",
      });
      return;
    }
    if (!id) return;
    createCommentMutation.mutate({ postId: id, content: commentContent.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-2">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400 font-medium">Đang tải chi tiết bài viết...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto text-center p-12 space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy bài viết</h2>
        <p className="text-sm text-gray-500">Bài đăng này có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
        <Link to="/forum">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl mt-4">
            Quay lại diễn đàn
          </Button>
        </Link>
      </div>
    );
  }

  const hasLiked = user ? post.likes.includes(user.id || user._id) : false;
  const isAuthorVip = post.userId?.hasMembership;
  const isVipGold = isAuthorVip && post.userId?.vipTheme === "gold";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
        <ArrowLeft size={16} />
        Quay lại Diễn đàn
      </Link>

      {/* Main Post Card */}
      <Card className="border-gray-200/60 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {/* Author Header */}
          <div className="flex items-center gap-3">
            <VipAvatar
              avatarUrl={post.userId?.avatar}
              name={post.userId?.name}
              hasMembership={post.userId?.hasMembership}
              vipAvatarFrame={post.userId?.vipAvatarFrame}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-sm font-black truncate leading-tight ${
                    isAuthorVip
                      ? isVipGold
                        ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                        : "text-amber-500"
                      : "text-gray-900"
                  }`}
                >
                  {post.userId?.name || "Đạo hữu ẩn danh"}
                </span>
                {isAuthorVip && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                    <Award size={10} className="fill-amber-700/20" />
                    VIP Member
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-gray-400">
                {post.createdAt
                  ? formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })
                  : "Vừa xong"}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-orange-50 text-orange-600 border-none font-bold text-xs rounded-xl px-3 py-1"
            >
              {post.category === "review" ? "Review món ăn" : post.category === "life" ? "Đời sống" : post.category === "knowledge" ? "Kiến thức" : "Tám chuyện"}
            </Badge>
          </div>

          {/* Title & Body */}
          <div className="space-y-3">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
              {post.title}
            </h1>
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 font-bold text-xs md:text-sm transition-colors hover:text-red-500 group ${
                hasLiked ? "text-red-500" : ""
              }`}
            >
              <Heart
                size={16}
                className={`transition-transform duration-200 group-hover:scale-125 ${
                  hasLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span>{post.likes?.length || 0} Người thích</span>
            </button>
            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm">
              <MessageSquare size={16} />
              <span>{comments.length} Bình luận</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Bình luận ({comments.length})
        </h2>

        {/* Comment input form */}
        <Card className="border-gray-200/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-end">
              <VipAvatar
                avatarUrl={user?.avatar}
                name={user?.name}
                hasMembership={user?.hasMembership}
                vipAvatarFrame={user?.vipAvatarFrame}
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Gõ bình luận hoặc góp ý của đạo hữu vào đây nhé..."
                  rows={2}
                  className="w-full text-sm rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={createCommentMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-10 w-10 p-0 flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0"
              >
                <Send size={15} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-semibold">
              Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            comments.map((comment: any) => {
              const isCommentAuthorVip = comment.userId?.hasMembership;
              const isCommentVipGold = isCommentAuthorVip && comment.userId?.vipTheme === "gold";

              return (
                <Card key={comment._id} className="border-gray-200/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex gap-3">
                    <VipAvatar
                      avatarUrl={comment.userId?.avatar}
                      name={comment.userId?.name}
                      hasMembership={comment.userId?.hasMembership}
                      vipAvatarFrame={comment.userId?.vipAvatarFrame}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-black truncate leading-none ${
                              isCommentAuthorVip
                                ? isCommentVipGold
                                  ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                    : "text-amber-500"
                                  : "text-gray-900"
                            }`}
                          >
                            {comment.userId?.name || "Đạo hữu ẩn danh"}
                          </span>
                          {isCommentAuthorVip && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90 leading-none">
                              👑 VIP
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {comment.createdAt
                            ? formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })
                            : "Vừa xong"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
