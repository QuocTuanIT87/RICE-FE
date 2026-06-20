import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forumApi, usersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import VipAvatar from "@/components/VipAvatar";
import { VipMascotInline } from "@/components/VipMascots";
import { useSocket } from "@/contexts/SocketContext";
import {
  MessageSquare,
  Heart,
  Filter,
  Search,
  Award,
  TrendingUp,
  Crown,
  Sparkles,
  BookOpen,
  MessageCircle,
  Utensils,
  Share2,
  Send,
  Loader2,
  ThumbsUp,
  Image as ImageIcon,
  X,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { swalToast } from "@/utils/swal";

const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "general", label: "Tám chuyện" },
  { value: "review", label: "Review món ăn" },
  { value: "life", label: "Đời sống" },
  { value: "knowledge", label: "Kiến thức" },
];

const REACTION_TYPES = [
  {
    value: "like",
    emoji: "👍",
    label: "Thích",
    color: "text-blue-500 hover:text-blue-600 font-extrabold",
  },
  {
    value: "love",
    emoji: "❤️",
    label: "Yêu thích",
    color: "text-red-500 hover:text-red-650 font-extrabold",
  },
  {
    value: "haha",
    emoji: "😆",
    label: "Haha",
    color: "text-yellow-500 hover:text-yellow-600 font-extrabold",
  },
  {
    value: "wow",
    emoji: "😮",
    label: "Wow",
    color: "text-yellow-550 hover:text-yellow-600 font-extrabold",
  },
  {
    value: "sad",
    emoji: "😢",
    label: "Buồn",
    color: "text-blue-400 hover:text-blue-500 font-extrabold",
  },
  {
    value: "angry",
    emoji: "😡",
    label: "Phẫn nộ",
    color: "text-orange-550 hover:text-orange-600 font-extrabold",
  },
];

export default function ForumPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();
  const getProfileLink = (authorId?: string) => {
    const targetId = authorId || user?.id || user?._id;
    return targetId ? `/user/${targetId}` : "/profile";
  };
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  const { data: friendUsersResponse, isLoading: friendSearchLoading } = useQuery({
    queryKey: ["forumFriendSearch", friendSearchQuery],
    queryFn: () => usersApi.searchUsers({ search: friendSearchQuery, limit: 8 }),
    enabled: friendSearchQuery.trim().length > 0,
  });

  const friendUsersList = (friendUsersResponse?.data?.data?.docs || []).filter(
    (u: any) => u.role !== "admin"
  );

  // Post form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  // Selected post for modal view
  const [selectedDetailPostId, setSelectedDetailPostId] = useState<
    string | null
  >(null);
  const [detailCommentContent, setDetailCommentContent] = useState("");

  // Reply states
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(
    null,
  );
  const [replyContent, setReplyContent] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!socket) return;

    const handlePostCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    };

    const handleCommentCreated = (data: { postId: string; comment: any }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      if (selectedDetailPostId === data.postId) {
        queryClient.invalidateQueries({
          queryKey: ["forumPostDetail", data.postId],
        });
      }
    };

    const handleReactionUpdated = (data: {
      targetType: "post" | "comment";
      targetId: string;
      postId?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      if (selectedDetailPostId) {
        if (
          (data.targetType === "post" &&
            data.targetId === selectedDetailPostId) ||
          (data.targetType === "comment" &&
            data.postId === selectedDetailPostId)
        ) {
          queryClient.invalidateQueries({
            queryKey: ["forumPostDetail", selectedDetailPostId],
          });
        }
      }
    };

    socket.on("forum_post_created", handlePostCreated);
    socket.on("forum_comment_created", handleCommentCreated);
    socket.on("forum_reaction_updated", handleReactionUpdated);

    return () => {
      socket.off("forum_post_created", handlePostCreated);
      socket.off("forum_comment_created", handleCommentCreated);
      socket.off("forum_reaction_updated", handleReactionUpdated);
    };
  }, [socket, selectedDetailPostId, queryClient]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Định dạng không hợp lệ",
        description: "Vui lòng chọn một tệp hình ảnh.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Tệp quá lớn",
        description: "Dung lượng ảnh tối đa là 5MB.",
      });
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Fetch posts
  const { data: postsResponse, isLoading } = useQuery({
    queryKey: ["forumPosts", selectedCategory],
    queryFn: () =>
      forumApi.getPosts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 50,
      }),
  });

  const posts = postsResponse?.data.data?.docs || [];

  // Fetch selected post details for modal
  const { data: detailResponse, isLoading: detailLoading } = useQuery({
    queryKey: ["forumPostDetail", selectedDetailPostId],
    queryFn: () => forumApi.getPostById(selectedDetailPostId || ""),
    enabled: !!selectedDetailPostId,
  });

  const detailPost = detailResponse?.data.data?.post;
  const detailComments = detailResponse?.data.data?.comments || [];

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: FormData) => forumApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      setIsCreateOpen(false);
      setTitle("");
      setContent("");
      setCategory("general");
      setImageFile(null);
      setImagePreview(null);
      toast({
        title: "Đăng bài thành công!",
        description: "Bài viết của bạn đã được đăng lên diễn đàn.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Không thể đăng bài",
        description:
          err.response?.data?.error?.message ||
          "Vui lòng kiểm tra lại nội dung.",
      });
    },
  });

  // React to post mutation
  const reactPostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: string }) =>
      forumApi.reactPost(postId, type),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      queryClient.invalidateQueries({ queryKey: ["forumPostDetail", postId] });
    },
  });

  const handleReactPost = (
    e: React.MouseEvent,
    postId: string,
    type: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    reactPostMutation.mutate({ postId, type });
  };

  // React to comment mutation
  const reactCommentMutation = useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: string }) =>
      forumApi.reactComment(commentId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["forumPostDetail", selectedDetailPostId],
      });
    },
  });

  const handleReactComment = (commentId: string, type: string) => {
    reactCommentMutation.mutate({ commentId, type });
  };

  // Create comment mutation for modal
  const createCommentMutation = useMutation({
    mutationFn: ({
      postId,
      content,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string;
    }) => forumApi.createComment(postId, content, parentId),
    onSuccess: () => {
      setDetailCommentContent("");
      setReplyContent("");
      setReplyingCommentId(null);
      queryClient.invalidateQueries({
        queryKey: ["forumPostDetail", selectedDetailPostId],
      });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast({
        title: "Bình luận thành công!",
        description: "Bình luận của bạn đã được đăng.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi bình luận",
        description:
          err.response?.data?.error?.message || "Vui lòng nhập lại bình luận.",
      });
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    formData.append("category", category);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    createPostMutation.mutate(formData);
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!selectedDetailPostId) return;
    createCommentMutation.mutate({
      postId: selectedDetailPostId,
      content: replyContent.trim(),
      parentId,
    });
  };

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/forum/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    swalToast({
      title: "Đã sao chép liên kết bài viết!",
      icon: "success",
    });
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Compute hot posts dynamically on the client side
  const hotPosts = [...posts]
    .sort(
      (a, b) =>
        (b.commentsCount || 0) +
        (b.likes?.length || 0) -
        ((a.commentsCount || 0) + (a.likes?.length || 0)),
    )
    .slice(0, 4);

  // Helper to extract active user's reaction from post/comment
  const getMyReaction = (reactions?: any[]) => {
    if (!user || !reactions) return null;
    const currentUserId = user.id || user._id;
    return reactions.find((r) => (r.userId?._id || r.userId) === currentUserId);
  };

  // Helper to render reaction summary icons (👍❤️😆) and count
  const renderReactionSummary = (reactions?: any[]) => {
    if (!reactions || reactions.length === 0) return null;

    // Count unique reaction types
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    const sortedTypes = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a],
    );

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center -space-x-1 select-none">
          {sortedTypes.slice(0, 3).map((type) => {
            const config = REACTION_TYPES.find((rt) => rt.value === type);
            return (
              <span
                key={type}
                className="text-xs filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
              >
                {config?.emoji || "👍"}
              </span>
            );
          })}
        </div>
        <span className="hover:underline font-bold text-gray-500 text-[10px]">
          {reactions.length} cảm xúc
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Forum Header */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            handleRemoveImage();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white">
          <form onSubmit={handleCreatePost}>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Viết Bài Thảo Luận Mới
              </DialogTitle>
              <DialogDescription>
                Chia sẻ ý kiến hoặc phản hồi món ăn cùng các đồng nghiệp trong
                công ty.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="post-title" className="font-bold text-gray-700">
                  Tiêu đề bài đăng
                </Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề ngắn gọn xúc tích..."
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="post-category"
                  className="font-bold text-gray-700"
                >
                  Chủ đề
                </Label>
                <select
                  id="post-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="general">Tám chuyện</option>
                  <option value="review">Review món ăn</option>
                  <option value="life">Đời sống</option>
                  <option value="knowledge">Kiến thức</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="post-content"
                  className="font-bold text-gray-700"
                >
                  Nội dung
                </Label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hãy viết gì đó vui vẻ hoặc review món cơm hôm nay..."
                  rows={5}
                  className="w-full text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">
                  Hình ảnh đính kèm (Tùy chọn)
                </Label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-[180px] bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain max-h-[180px]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-500/50 hover:bg-orange-50/10 transition-all select-none">
                    <ImageIcon className="text-gray-400 mb-1" size={20} />
                    <span className="text-xs text-gray-500 font-bold">
                      Chọn hình ảnh để tải lên
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      JPEG, PNG, WEBP (Tối đa 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  handleRemoveImage();
                }}
                className="rounded-xl border-gray-200 text-gray-500 font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                Đăng bài
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Filter Categories */}
        <div className="md:col-span-1 space-y-4 md:sticky md:top-[80px] self-start">
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
              <CardTitle className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                <Filter size={16} className="text-orange-500" />
                Lọc theo chủ đề
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => {
                  const catIcons: Record<string, React.ReactNode> = {
                    all: <MessageSquare size={16} />,
                    general: <MessageCircle size={16} />,
                    review: <Utensils size={16} />,
                    life: <Heart size={16} />,
                    knowledge: <BookOpen size={16} />,
                  };

                  const isSelected = selectedCategory === cat.value;

                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5",
                        isSelected
                          ? "bg-orange-50 text-orange-600 font-extrabold shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <span
                        className={cn(
                          "p-1.5 rounded-lg",
                          isSelected
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {catIcons[cat.value] || <MessageSquare size={16} />}
                      </span>
                      <span>{cat.label}</span>
                      {isSelected && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Search Card */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden p-4 space-y-3 bg-white">
            <h3 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
              <Search size={16} className="text-orange-500" />
              Tìm kiếm bài viết
            </h3>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="rounded-xl border-gray-200"
            />
          </Card>

          {/* Friend Search Card */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden p-4 space-y-3 bg-white">
            <h3 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
              <User size={16} className="text-orange-500" />
              Tìm kiếm đồng nghiệp
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Tìm tên hoặc email..."
                className="pl-9 rounded-xl border-gray-200"
              />
            </div>
            
            {friendSearchLoading ? (
              <div className="flex items-center gap-2 justify-center py-3 text-xs text-gray-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tìm kiếm...
              </div>
            ) : friendUsersList.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2 pr-1 custom-scrollbar">
                {friendUsersList.map((u: any) => {
                  const isVip = u.hasMembership;
                  const isGold = isVip && u.vipCosmetics?.vipTheme === "gold";
                  return (
                    <Link
                      key={u._id || u.id}
                      to={getProfileLink(u._id || u.id)}
                      className="flex items-center gap-2.5 p-2 rounded-xl transition-all hover:bg-orange-50/50 border border-transparent hover:border-orange-100"
                    >
                      <VipAvatar
                        avatarUrl={u.avatar}
                        name={u.name}
                        hasMembership={u.hasMembership}
                        vipAvatarFrame={u.vipCosmetics?.vipAvatarFrame}
                        size="sm"
                      />
                      <div className="truncate min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className={cn(
                            "font-extrabold text-xs truncate leading-tight",
                            isVip
                              ? isGold
                                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-black"
                                : "text-amber-500"
                              : "text-gray-800"
                          )}>
                            {u.name}
                          </p>
                          {isVip && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90">
                              👑
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate leading-tight">
                          {u.email}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : friendSearchQuery ? (
              <p className="text-center py-2 text-[10px] text-gray-450 font-bold">Không tìm thấy đồng nghiệp nào</p>
            ) : (
              <p className="text-[10px] text-gray-400 font-bold italic">Nhập tên để tìm kiếm nhanh đồng đạo...</p>
            )}
          </Card>
        </div>

        {/* Middle Column: Post Creator + Feed */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          {/* Post Creator Card (Facebook Style) */}
          <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Link to={getProfileLink()} className="shrink-0">
                <VipAvatar
                  avatarUrl={user?.avatar}
                  name={user?.name}
                  hasMembership={user?.hasMembership}
                  vipAvatarFrame={user?.vipCosmetics?.vipAvatarFrame}
                  size="md"
                />
              </Link>
              <button
                onClick={() => {
                  setCategory("general");
                  setIsCreateOpen(true);
                }}
                className="flex-1 text-left px-4 py-3 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-500 text-xs font-medium border border-gray-200/50 transition-colors focus:outline-none"
              >
                {user?.name
                  ? `${user.name} ơi, hôm nay bạn có chia sẻ gì không?`
                  : "Hôm nay bạn muốn chia sẻ gì thế?"}
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-around text-xs text-gray-500 font-bold">
              <button
                onClick={() => {
                  setCategory("general");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-sky-600 transition-colors flex-1"
              >
                <MessageCircle size={16} />
                <span>Đăng bài</span>
              </button>
              <button
                onClick={() => {
                  setCategory("review");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-emerald-600 transition-colors flex-1"
              >
                <Utensils size={16} />
                <span>Review món</span>
              </button>
              <button
                onClick={() => {
                  setCategory("knowledge");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-amber-500 transition-colors flex-1"
              >
                <BookOpen size={16} />
                <span>Kiến thức</span>
              </button>
            </div>
          </Card>

          {/* Feed */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200/60 rounded-2xl space-y-2 shadow-sm">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">
                Đang tải luồng thảo luận...
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
              <div className="text-4xl mb-2">💬</div>
              <h3 className="font-bold text-lg text-gray-800">
                Chưa có bài viết nào
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Đạo hữu hãy là người đầu tiên khơi mào cuộc thảo luận nhé!
              </p>
            </div>
          ) : (
            filteredPosts.map((post: any) => {
              const myReaction = getMyReaction(post.reactions);
              const myReactionConfig = myReaction
                ? REACTION_TYPES.find((rt) => rt.value === myReaction.type)
                : null;
              const myReactionLabel = myReactionConfig
                ? myReactionConfig.label
                : "Thích";
              const myReactionColor = myReactionConfig
                ? myReactionConfig.color
                : "text-gray-650 hover:text-blue-500";
              const myReactionIcon = myReactionConfig ? (
                <span className="text-sm shrink-0 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                  {myReactionConfig.emoji}
                </span>
              ) : (
                <ThumbsUp
                  size={16}
                  className="text-gray-500 transition-transform group-hover:scale-110"
                />
              );

              const postCategory =
                CATEGORIES.find((c) => c.value === post.category)?.label ||
                "Tám chuyện";

              // VIP styling checks
              const isAuthorVip = post.userId?.hasMembership;
              const isVipGold =
                isAuthorVip && post.userId?.vipCosmetics?.vipTheme === "gold";

              return (
                <div
                  key={post._id}
                  onClick={() => setSelectedDetailPostId(post._id)}
                  className="border border-gray-200/80 hover:border-orange-250 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden shadow-sm cursor-pointer bg-white"
                >
                  <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-4 md:p-5 space-y-4">
                      {/* Author Header */}
                      <div
                        className="flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={getProfileLink(
                            post.userId?._id || post.userId?.id,
                          )}
                          className="shrink-0"
                        >
                          <VipAvatar
                            avatarUrl={post.userId?.avatar}
                            name={post.userId?.name}
                            hasMembership={post.userId?.hasMembership}
                            vipAvatarFrame={
                              post.userId?.vipCosmetics?.vipAvatarFrame
                            }
                            size="md"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={getProfileLink(
                                post.userId?._id || post.userId?.id,
                              )}
                              className="hover:underline"
                            >
                              <span
                                className={cn(
                                  "text-sm font-black truncate leading-tight",
                                  isAuthorVip
                                    ? isVipGold
                                      ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                      : "text-amber-500"
                                    : "text-gray-900",
                                )}
                              >
                                {post.userId?.name || "Đạo hữu ẩn danh"}
                              </span>
                            </Link>
                            {isAuthorVip && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                                <Award
                                  size={10}
                                  className="fill-amber-700/20"
                                />
                                VIP Member
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
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
                          className="bg-orange-50 text-orange-600 border-none font-bold text-xs rounded-xl px-2.5 py-1"
                        >
                          {postCategory}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h2 className="text-base font-extrabold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">
                          {post.title}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-gray-100 max-h-[320px] mt-2 select-none">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover max-h-[320px] hover:scale-[1.01] transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Engagement statistics - Row 1 */}
                      <div
                        className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderReactionSummary(post.reactions)}
                        <div className="hover:underline font-bold text-gray-500 text-[10px]">
                          {post.commentsCount || 0} bình luận
                        </div>
                      </div>

                      {/* Footer Actions - Row 2 */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-gray-500 text-xs font-bold gap-1">
                        {/* Reactions button wrapper */}
                        <div
                          className="relative group/react-btn flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Floating Reaction Bar */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/react-btn:flex items-center gap-1.5 bg-white p-2 rounded-full shadow-lg border border-gray-100 animate-fade-in z-20 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-4">
                            {REACTION_TYPES.map((rt) => (
                              <button
                                key={rt.value}
                                onClick={(e) =>
                                  handleReactPost(e, post._id, rt.value)
                                }
                                className="text-xl transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                title={rt.label}
                              >
                                {rt.emoji}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={(e) =>
                              handleReactPost(
                                e,
                                post._id,
                                myReaction ? myReaction.type : "like",
                              )
                            }
                            className={cn(
                              "flex items-center justify-center gap-1.5 py-2 w-full rounded-xl transition-all hover:bg-gray-50",
                              myReaction ? "bg-gray-50/50" : "",
                            )}
                          >
                            {myReactionIcon}
                            <span className={cn(myReactionColor)}>
                              {myReactionLabel}
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedDetailPostId(post._id);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1"
                        >
                          <MessageSquare size={16} />
                          <span>Bình luận</span>
                        </button>

                        <button
                          onClick={(e) => handleShare(e, post._id)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1 text-center"
                        >
                          <Share2 size={16} />
                          <span>Chia sẻ</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Hot Topics & VIP Spotlights */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-[80px] self-start">
          {/* Hot Topics */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
              <CardTitle className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-red-500" />
                Đang nổi bật 🔥
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {hotPosts.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">
                  Chưa có bài viết nào nổi bật.
                </p>
              ) : (
                hotPosts.map((hp: any, idx: number) => (
                  <button
                    key={hp._id}
                    onClick={() => setSelectedDetailPostId(hp._id)}
                    className="w-full text-left block group space-y-1.5 pb-3 border-b border-gray-50 last:border-none last:pb-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-orange-500 mt-0.5">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs font-black text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                        {hp.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pl-4">
                      <span>{hp.userId?.name || "Ẩn danh"}</span>
                      <span className="flex items-center gap-1 font-bold text-gray-500">
                        💬 {hp.commentsCount || 0} • ❤️ {hp.likes?.length || 0}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* VIP Spotlights Promotion Card */}
          <Card className="border border-amber-200 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/5 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Crown size={16} className="animate-bounce" />
                </div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  Đặc quyền vinh danh VIP
                </h4>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                Sở hữu thẻ hội viên VIP để bài viết của đạo hữu luôn nổi bật với
                khung viền lấp lánh và tên gradient độc quyền trên diễn đàn!
              </p>

              <ul className="space-y-1.5 text-[10px] text-amber-800 font-bold">
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className="text-amber-500 animate-pulse"
                  />
                  <span>Khung Avatar VIP đặc chế</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className="text-amber-500 animate-pulse"
                  />
                  <span>Tên gradient Hoàng Kim lấp lánh</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className="text-amber-500 animate-pulse"
                  />
                  <span>Giảm ngay 2.000đ mỗi phần cơm</span>
                </li>
              </ul>

              <Link to="/vip" className="block pt-2">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl h-9 border-none shadow-sm shadow-amber-200">
                  Khám phá Gói VIP →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Dynamic Mascot Inline Advisor */}
          <VipMascotInline />
        </div>
      </div>

      {/* Post Detail Modal (Facebook Style) */}
      <Dialog
        open={!!selectedDetailPostId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDetailPostId(null);
            setDetailCommentContent("");
            setReplyingCommentId(null);
            setReplyContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto rounded-2xl flex flex-col p-0 gap-0 custom-scrollbar bg-white">
          {detailLoading && !detailPost ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-2">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-400 font-semibold">
                Đang tải bài viết...
              </p>
            </div>
          ) : detailPost ? (
            <>
              {/* Modal Header */}
              <div className="p-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <DialogTitle className="text-base font-black text-gray-950">
                  Bài viết của {detailPost.userId?.name || "Đạo hữu"}
                </DialogTitle>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Link
                    to={getProfileLink(
                      detailPost.userId?._id || detailPost.userId?.id,
                    )}
                    className="shrink-0"
                  >
                    <VipAvatar
                      avatarUrl={detailPost.userId?.avatar}
                      name={detailPost.userId?.name}
                      hasMembership={detailPost.userId?.hasMembership}
                      vipAvatarFrame={
                        detailPost.userId?.vipCosmetics?.vipAvatarFrame
                      }
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={getProfileLink(
                          detailPost.userId?._id || detailPost.userId?.id,
                        )}
                        className="hover:underline"
                      >
                        <span
                          className={cn(
                            "text-sm font-black truncate leading-tight",
                            detailPost.userId?.hasMembership
                              ? detailPost.userId?.vipCosmetics?.vipTheme ===
                                "gold"
                                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                : "text-amber-500"
                              : "text-gray-900",
                          )}
                        >
                          {detailPost.userId?.name || "Đạo hữu ẩn danh"}
                        </span>
                      </Link>
                      {detailPost.userId?.hasMembership && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                          👑 VIP
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {detailPost.createdAt
                        ? formatDistanceToNow(new Date(detailPost.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })
                        : "Vừa xong"}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-orange-50 text-orange-600 border-none font-bold text-xs rounded-xl px-2.5 py-1"
                  >
                    {CATEGORIES.find((c) => c.value === detailPost.category)
                      ?.label || "Tám chuyện"}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h2 className="text-base md:text-lg font-black text-gray-900 leading-snug">
                    {detailPost.title}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-750 whitespace-pre-line leading-relaxed">
                    {detailPost.content}
                  </p>
                  {detailPost.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 mt-2 select-none">
                      <img
                        src={detailPost.imageUrl}
                        alt={detailPost.title}
                        className="w-full object-contain max-h-[400px] bg-black/5"
                      />
                    </div>
                  )}
                </div>

                {/* Likes/Comments statistics */}
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-55">
                  {renderReactionSummary(detailPost.reactions)}
                  <div className="font-bold text-gray-500 text-[10px]">
                    {detailComments.length} bình luận
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between py-1 border-t border-b border-gray-100 text-gray-500 text-xs font-bold gap-1">
                  {/* Modal Post Reaction Button with Hover */}
                  <div className="relative group/modal-react flex-1">
                    {/* Floating Reaction Bar */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/modal-react:flex items-center gap-1.5 bg-white p-2 rounded-full shadow-lg border border-gray-100 animate-fade-in z-20 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-4">
                      {REACTION_TYPES.map((rt) => (
                        <button
                          key={rt.value}
                          onClick={(e) =>
                            handleReactPost(e, detailPost._id, rt.value)
                          }
                          className="text-xl transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                          title={rt.label}
                        >
                          {rt.emoji}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        const myReact = getMyReaction(detailPost.reactions);
                        handleReactPost(
                          e,
                          detailPost._id,
                          myReact ? myReact.type : "like",
                        );
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 w-full rounded-xl transition-all hover:bg-gray-50",
                        getMyReaction(detailPost.reactions)
                          ? "bg-gray-50/50"
                          : "",
                      )}
                    >
                      {getMyReaction(detailPost.reactions) ? (
                        <span className="text-sm shrink-0 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                          {
                            REACTION_TYPES.find(
                              (rt) =>
                                rt.value ===
                                getMyReaction(detailPost.reactions)?.type,
                            )?.emoji
                          }
                        </span>
                      ) : (
                        <ThumbsUp size={16} className="text-gray-500" />
                      )}
                      <span
                        className={cn(
                          getMyReaction(detailPost.reactions)
                            ? REACTION_TYPES.find(
                                (rt) =>
                                  rt.value ===
                                  getMyReaction(detailPost.reactions)?.type,
                              )?.color
                            : "text-gray-600",
                        )}
                      >
                        {getMyReaction(detailPost.reactions)
                          ? REACTION_TYPES.find(
                              (rt) =>
                                rt.value ===
                                getMyReaction(detailPost.reactions)?.type,
                            )?.label
                          : "Thích"}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleShare(e, detailPost._id)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1"
                  >
                    <Share2 size={16} />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                {/* Comments List Section */}
                <div className="space-y-4 pt-1">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    Bình luận ({detailComments.length})
                  </h3>

                  {/* Comment list scroll container */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {detailComments.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                        Chưa có bình luận nào. Hãy bắt đầu thảo luận!
                      </div>
                    ) : (
                      (() => {
                        // Filter parent comments vs replies
                        const parentComments = detailComments.filter(
                          (c: any) => !c.parentId,
                        );
                        const replyComments = detailComments.filter(
                          (c: any) => c.parentId,
                        );

                        return parentComments.map((parent: any) => {
                          const parentReaction = getMyReaction(
                            parent.reactions,
                          );
                          const parentReplies = replyComments.filter(
                            (r: any) =>
                              (r.parentId?._id || r.parentId) === parent._id,
                          );

                          return (
                            <div key={parent._id} className="space-y-3">
                              {/* Parent Comment */}
                              <div className="flex gap-2.5 items-start">
                                <Link
                                  to={getProfileLink(
                                    parent.userId?._id || parent.userId?.id,
                                  )}
                                  className="flex-shrink-0"
                                >
                                  <VipAvatar
                                    avatarUrl={parent.userId?.avatar}
                                    name={parent.userId?.name}
                                    hasMembership={parent.userId?.hasMembership}
                                    vipAvatarFrame={
                                      parent.userId?.vipCosmetics
                                        ?.vipAvatarFrame
                                    }
                                    size="sm"
                                  />
                                </Link>
                                <div className="flex-1">
                                  <div className="relative inline-block max-w-[95%]">
                                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        <Link
                                          to={getProfileLink(
                                            parent.userId?._id ||
                                              parent.userId?.id,
                                          )}
                                          className="hover:underline"
                                        >
                                          <span
                                            className={cn(
                                              "text-xs font-black truncate leading-none",
                                              parent.userId?.hasMembership
                                                ? parent.userId?.vipCosmetics
                                                    ?.vipTheme === "gold"
                                                  ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                                  : "text-amber-500"
                                                : "text-gray-900",
                                            )}
                                          >
                                            {parent.userId?.name ||
                                              "Đạo hữu ẩn danh"}
                                          </span>
                                        </Link>
                                        {parent.userId?.hasMembership && (
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90 leading-none">
                                            👑 VIP
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                        {parent.content}
                                      </p>
                                    </div>

                                    {/* Parent Comment Reactions Indicator */}
                                    {parent.reactions &&
                                      parent.reactions.length > 0 && (
                                        <div className="absolute -bottom-2 right-2 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-0.5 text-[9px] font-bold text-gray-500 select-none z-10">
                                          <div className="flex -space-x-0.5">
                                            {Array.from(
                                              new Set(
                                                parent.reactions.map(
                                                  (r: any) => r.type,
                                                ),
                                              ),
                                            )
                                              .slice(0, 2)
                                              .map((type: any) => (
                                                <span key={type}>
                                                  {REACTION_TYPES.find(
                                                    (rt) => rt.value === type,
                                                  )?.emoji || "👍"}
                                                </span>
                                              ))}
                                          </div>
                                          <span>{parent.reactions.length}</span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Action links row */}
                                  <div className="flex items-center gap-3 pl-3 mt-1 text-[10px] text-gray-400 font-bold">
                                    <div className="relative group/comm-react">
                                      {/* Comment Reaction list */}
                                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover/comm-react:flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 animate-fade-in z-25 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-3">
                                        {REACTION_TYPES.map((rt) => (
                                          <button
                                            key={rt.value}
                                            onClick={() =>
                                              handleReactComment(
                                                parent._id,
                                                rt.value,
                                              )
                                            }
                                            className="text-sm transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                          >
                                            {rt.emoji}
                                          </button>
                                        ))}
                                      </div>

                                      <button
                                        onClick={() =>
                                          handleReactComment(
                                            parent._id,
                                            parentReaction
                                              ? parentReaction.type
                                              : "like",
                                          )
                                        }
                                        className={cn(
                                          "hover:underline",
                                          parentReaction
                                            ? REACTION_TYPES.find(
                                                (rt) =>
                                                  rt.value ===
                                                  parentReaction.type,
                                              )?.color
                                            : "text-gray-500",
                                        )}
                                      >
                                        {parentReaction
                                          ? REACTION_TYPES.find(
                                              (rt) =>
                                                rt.value ===
                                                parentReaction.type,
                                            )?.label
                                          : "Thích"}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() =>
                                        setReplyingCommentId(
                                          replyingCommentId === parent._id
                                            ? null
                                            : parent._id,
                                        )
                                      }
                                      className="hover:underline text-gray-500"
                                    >
                                      Phản hồi
                                    </button>

                                    <span>
                                      {parent.createdAt
                                        ? formatDistanceToNow(
                                            new Date(parent.createdAt),
                                            {
                                              addSuffix: true,
                                              locale: vi,
                                            },
                                          )
                                        : "Vừa xong"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies */}
                              {parentReplies.length > 0 && (
                                <div className="pl-10 space-y-3 border-l-2 border-gray-100 ml-4">
                                  {parentReplies.map((reply: any) => {
                                    const replyReaction = getMyReaction(
                                      reply.reactions,
                                    );

                                    return (
                                      <div
                                        key={reply._id}
                                        className="flex gap-2 items-start"
                                      >
                                        <Link
                                          to={getProfileLink(
                                            reply.userId?._id ||
                                              reply.userId?.id,
                                          )}
                                          className="flex-shrink-0"
                                        >
                                          <VipAvatar
                                            avatarUrl={reply.userId?.avatar}
                                            name={reply.userId?.name}
                                            hasMembership={
                                              reply.userId?.hasMembership
                                            }
                                            vipAvatarFrame={
                                              reply.userId?.vipCosmetics
                                                ?.vipAvatarFrame
                                            }
                                            size="sm"
                                            className="w-7 h-7"
                                          />
                                        </Link>
                                        <div className="flex-1">
                                          <div className="relative inline-block max-w-[95%]">
                                            <div className="bg-gray-100 rounded-2xl px-3.5 py-1.5">
                                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <Link
                                                  to={getProfileLink(
                                                    reply.userId?._id ||
                                                      reply.userId?.id,
                                                  )}
                                                  className="hover:underline"
                                                >
                                                  <span
                                                    className={cn(
                                                      "text-[11px] font-black truncate leading-none",
                                                      reply.userId
                                                        ?.hasMembership
                                                        ? reply.userId
                                                            ?.vipCosmetics
                                                            ?.vipTheme ===
                                                          "gold"
                                                          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                                          : "text-amber-500"
                                                        : "text-gray-900",
                                                    )}
                                                  >
                                                    {reply.userId?.name ||
                                                      "Đạo hữu ẩn danh"}
                                                  </span>
                                                </Link>
                                                {reply.userId
                                                  ?.hasMembership && (
                                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90 leading-none">
                                                    👑 VIP
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-705 leading-relaxed whitespace-pre-line">
                                                {reply.content}
                                              </p>
                                            </div>

                                            {/* Reply Reaction counts */}
                                            {reply.reactions &&
                                              reply.reactions.length > 0 && (
                                                <div className="absolute -bottom-2 right-2 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-0.5 text-[9px] font-bold text-gray-505 select-none z-10">
                                                  <div className="flex -space-x-0.5">
                                                    {Array.from(
                                                      new Set(
                                                        reply.reactions.map(
                                                          (r: any) => r.type,
                                                        ),
                                                      ),
                                                    )
                                                      .slice(0, 2)
                                                      .map((type: any) => (
                                                        <span key={type}>
                                                          {REACTION_TYPES.find(
                                                            (rt) =>
                                                              rt.value === type,
                                                          )?.emoji || "👍"}
                                                        </span>
                                                      ))}
                                                  </div>
                                                  <span>
                                                    {reply.reactions.length}
                                                  </span>
                                                </div>
                                              )}
                                          </div>

                                          <div className="flex items-center gap-3 pl-3 mt-1 text-[10px] text-gray-400 font-bold">
                                            <div className="relative group/reply-react">
                                              {/* Reply Reaction list */}
                                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover/reply-react:flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 animate-fade-in z-25 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-3">
                                                {REACTION_TYPES.map((rt) => (
                                                  <button
                                                    key={rt.value}
                                                    onClick={() =>
                                                      handleReactComment(
                                                        reply._id,
                                                        rt.value,
                                                      )
                                                    }
                                                    className="text-xs transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                                  >
                                                    {rt.emoji}
                                                  </button>
                                                ))}
                                              </div>

                                              <button
                                                onClick={() =>
                                                  handleReactComment(
                                                    reply._id,
                                                    replyReaction
                                                      ? replyReaction.type
                                                      : "like",
                                                  )
                                                }
                                                className={cn(
                                                  "hover:underline",
                                                  replyReaction
                                                    ? REACTION_TYPES.find(
                                                        (rt) =>
                                                          rt.value ===
                                                          replyReaction.type,
                                                      )?.color
                                                    : "text-gray-500",
                                                )}
                                              >
                                                {replyReaction
                                                  ? REACTION_TYPES.find(
                                                      (rt) =>
                                                        rt.value ===
                                                        replyReaction.type,
                                                    )?.label
                                                  : "Thích"}
                                              </button>
                                            </div>

                                            <span>
                                              {reply.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(reply.createdAt),
                                                    {
                                                      addSuffix: true,
                                                      locale: vi,
                                                    },
                                                  )
                                                : "Vừa xong"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Reply Input Field */}
                              {replyingCommentId === parent._id && (
                                <div className="pl-10 ml-4 pt-1">
                                  <form
                                    onSubmit={(e) =>
                                      handleReplySubmit(e, parent._id)
                                    }
                                    className="flex gap-2 items-center"
                                  >
                                    <Link
                                      to={getProfileLink()}
                                      className="flex-shrink-0 hover:opacity-90 transition-opacity"
                                    >
                                      <VipAvatar
                                        avatarUrl={user?.avatar}
                                        name={user?.name}
                                        hasMembership={user?.hasMembership}
                                        vipAvatarFrame={
                                          user?.vipCosmetics?.vipAvatarFrame
                                        }
                                        size="sm"
                                        className="w-7 h-7"
                                      />
                                    </Link>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) =>
                                          setReplyContent(e.target.value)
                                        }
                                        placeholder={`Trả lời ${parent.userId?.name || "đạo hữu"}...`}
                                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                      />
                                    </div>
                                    <Button
                                      type="submit"
                                      disabled={createCommentMutation.isPending}
                                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-8 w-8 p-0 flex items-center justify-center shadow-md shadow-orange-100 flex-shrink-0"
                                    >
                                      <Send size={12} />
                                    </Button>
                                  </form>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Comment Input Form Footer (Parent comment only) */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!detailCommentContent.trim()) {
                      toast({
                        variant: "destructive",
                        title: "Thiếu nội dung",
                        description: "Vui lòng nhập nội dung bình luận.",
                      });
                      return;
                    }
                    createCommentMutation.mutate({
                      postId: detailPost._id,
                      content: detailCommentContent.trim(),
                    });
                  }}
                  className="flex gap-2.5 items-end"
                >
                  <Link
                    to={getProfileLink()}
                    className="flex-shrink-0 hover:opacity-90 transition-opacity"
                  >
                    <VipAvatar
                      avatarUrl={user?.avatar}
                      name={user?.name}
                      hasMembership={user?.hasMembership}
                      vipAvatarFrame={user?.vipCosmetics?.vipAvatarFrame}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1">
                    <textarea
                      value={detailCommentContent}
                      onChange={(e) => setDetailCommentContent(e.target.value)}
                      placeholder="Viết bình luận của bạn..."
                      rows={1}
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none max-h-[80px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createCommentMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-9 w-9 p-0 flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0"
                  >
                    <Send size={14} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Không tìm thấy bài viết.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
