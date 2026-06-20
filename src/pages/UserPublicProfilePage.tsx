import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "@/services/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VipAvatar from "@/components/VipAvatar";
import { getMascotCardConfig } from "@/components/VipMascots";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Rss,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Shield,
  Loader2,
  Crown,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { swalToast, swalAlert, swalConfirm } from "@/utils/swal";

export default function UserPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  // Fetch public profile details
  const { data: profileResponse, isLoading, error } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => socialApi.getPublicProfile(userId || ""),
    enabled: !!userId,
  });

  const profile = profileResponse?.data.data;
  const isMe = currentUser?.id === userId || currentUser?._id === userId;

  // Friend mutations
  const sendRequestMutation = useMutation({
    mutationFn: () => socialApi.sendFriendRequest(userId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: res.data.message || "Đã gửi lời mời kết bạn!", icon: "success" });
    },
    onError: (err: any) => {
      swalAlert({
        title: "Lỗi kết bạn",
        text: err.response?.data?.error?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: () => socialApi.acceptFriendRequest(userId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: res.data.message || "Đã đồng ý kết bạn!", icon: "success" });
    },
    onError: (err: any) => {
      swalAlert({
        title: "Lỗi đồng ý kết bạn",
        text: err.response?.data?.error?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: () => socialApi.declineFriendRequest(userId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: res.data.message || "Đã hủy lời mời kết bạn!", icon: "success" });
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: () => socialApi.unfriend(userId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: "Đã hủy kết bạn!", icon: "success" });
    },
  });

  // Follow mutations
  const followMutation = useMutation({
    mutationFn: () => socialApi.followUser(userId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: "Đã theo dõi đạo hữu!", icon: "success" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => socialApi.unfollowUser(userId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile", userId] });
      swalToast({ title: "Đã hủy theo dõi!", icon: "success" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-sm text-gray-500 font-semibold">Đang tải hồ sơ đạo hữu...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="text-6xl">🔍❌</div>
        <h2 className="text-xl font-black text-gray-900">Không tìm thấy đạo hữu</h2>
        <p className="text-gray-500 text-sm">Hồ sơ không khả dụng hoặc người dùng không tồn tại.</p>
        <Link to="/forum">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md">
            Quay lại diễn đàn
          </Button>
        </Link>
      </div>
    );
  }

  const { user, friendsCount, followersCount, followingCount, friendStatus, isFollowing, recentPosts } = profile;
  const isVip = user.hasMembership;
  const vipTheme = user.vipCosmetics?.vipTheme || "default";
  const vipMascot = user.vipCosmetics?.vipMascot || "ronaldo";
  const mascotConfig = isVip && vipMascot !== "none" ? getMascotCardConfig(vipMascot) : null;

  const handleFriendAction = async () => {
    setIsProcessingFriend(true);
    try {
      if (friendStatus === "none") {
        await sendRequestMutation.mutateAsync();
      } else if (friendStatus === "pending_sent") {
        await declineRequestMutation.mutateAsync();
      } else if (friendStatus === "pending_received") {
        await acceptRequestMutation.mutateAsync();
      } else if (friendStatus === "friends") {
        swalConfirm({
          title: "Hủy kết bạn?",
          text: `Đạo hữu có chắc chắn muốn hủy kết bạn với ${user.name}? Điều này cũng sẽ tự động hủy theo dõi chéo.`,
          icon: "warning",
          confirmText: "Đồng ý",
          cancelText: "Hủy bỏ",
        }).then(async (result) => {
          if (result.isConfirmed) {
            await unfriendMutation.mutateAsync();
          }
        });
      }
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleFollowAction = async () => {
    setIsProcessingFollow(true);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync();
      } else {
        await followMutation.mutateAsync();
      }
    } finally {
      setIsProcessingFollow(false);
    }
  };

  return (
    <div className={cn("min-h-screen pb-12 transition-all duration-300", isVip && vipTheme !== "default" && `theme-${vipTheme}`)}>
      <div className="max-w-5xl mx-auto space-y-6 px-4">
        {/* Back Link */}
        <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
          <ArrowLeft size={16} />
          Quay lại diễn đàn
        </Link>

        {/* Profile Card Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          {/* Cover image area */}
          <div className={cn(
            "h-48 md:h-64 w-full relative transition-all duration-500",
            isVip && user.vipCosmetics?.vipCoverImage ? user.vipCosmetics.vipCoverImage : "bg-gradient-to-r from-orange-500 via-orange-500 to-red-600"
          )}>
            {/* VIP Mascot dialog if present */}
            {mascotConfig && (
              <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-white shadow-lg animate-fade-in max-w-sm cursor-pointer hover:bg-black/50 transition-colors" onClick={() => mascotConfig.clickAction()}>
                <img src={mascotConfig.avatar} alt="Mascot avatar" className="w-8 h-8 object-contain" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-amber-300 uppercase leading-none mb-0.5">{mascotConfig.title}</p>
                  <p className="text-[10px] font-bold truncate italic opacity-90 leading-normal">{mascotConfig.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile details & Actions */}
          <div className="px-6 pb-6 pt-4 md:px-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
                <VipAvatar
                  avatarUrl={user.avatar}
                  name={user.name}
                  hasMembership={isVip}
                  vipAvatarFrame={user.vipCosmetics?.vipAvatarFrame}
                  size="xl"
                  className="ring-8 ring-white bg-white shadow-lg rounded-3xl shrink-0 -mt-12 md:-mt-16 relative z-10"
                />
                <div className="space-y-2 md:mb-2">
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <h1 className={cn(
                      "text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5 justify-center md:justify-start",
                      isVip && vipTheme === "gold" && "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-extrabold drop-shadow-sm",
                      isVip && vipTheme === "sakura" && "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent font-extrabold",
                      isVip && vipTheme === "dark" && "bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent font-extrabold",
                      (!isVip || vipTheme === "default") && "text-gray-900"
                    )}>
                      {user.name}
                      {isVip && vipTheme === "gold" && <Crown size={18} className="text-amber-500 fill-amber-400 shrink-0" />}
                    </h1>
                    <Badge className={cn(
                      "font-black text-[9px] uppercase tracking-wider h-5 border-none",
                      isVip
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        : "bg-gray-100 text-gray-400"
                    )}>
                      {isVip ? user.membershipName : "Thành viên thường"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isMe && (
                <div className="flex items-center justify-center gap-2 shrink-0 md:mb-2">
                  {/* Friend Button */}
                  <Button
                    onClick={handleFriendAction}
                    disabled={isProcessingFriend}
                    className={cn(
                      "h-10 px-5 rounded-xl text-xs font-bold gap-2 shadow-sm border transition-all active:scale-95",
                      friendStatus === "friends" && "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700",
                      friendStatus === "pending_sent" && "bg-gray-100 border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600",
                      friendStatus === "pending_received" && "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100 border-none",
                      friendStatus === "none" && "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100 border-none"
                    )}
                  >
                    {friendStatus === "friends" && (
                      <>
                        <UserCheck size={16} />
                        <span>Bạn bè</span>
                      </>
                    )}
                    {friendStatus === "pending_sent" && (
                      <>
                        <UserMinus size={16} />
                        <span>Đã gửi yêu cầu</span>
                      </>
                    )}
                    {friendStatus === "pending_received" && (
                      <>
                        <UserPlus size={16} />
                        <span>Đồng ý kết bạn</span>
                      </>
                    )}
                    {friendStatus === "none" && (
                      <>
                        <UserPlus size={16} />
                        <span>Thêm bạn bè</span>
                      </>
                    )}
                  </Button>

                  {/* Accept / Decline additional actions for pending_received */}
                  {friendStatus === "pending_received" && (
                    <Button
                      onClick={() => declineRequestMutation.mutate()}
                      variant="ghost"
                      className="h-10 w-10 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100 rounded-xl"
                      title="Từ chối lời mời"
                    >
                      <UserX size={16} />
                    </Button>
                  )}

                  {/* Message Button */}
                  <Link to={`/chat?partnerId=${user._id || user.id}`}>
                    <Button
                      variant="outline"
                      className="h-10 px-4 rounded-xl text-xs font-bold gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <MessageCircle size={14} className="text-orange-500" />
                      <span>Nhắn tin</span>
                    </Button>
                  </Link>

                  {/* Follow Button */}
                  <Button
                    onClick={handleFollowAction}
                    disabled={isProcessingFollow}
                    variant="outline"
                    className={cn(
                      "h-10 px-4 rounded-xl text-xs font-bold gap-2 border transition-all active:scale-95",
                      isFollowing
                        ? "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Rss size={14} className={cn(isFollowing && "text-orange-500 animate-pulse")} />
                    <span>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Quick counters */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-gray-100 py-4 my-6 text-center">
              <div className="space-y-0.5">
                <p className="text-lg font-black text-gray-900">{friendsCount}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bạn bè</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-black text-gray-900">{followersCount}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Người theo dõi</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-black text-gray-900">{followingCount}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đang theo dõi</p>
              </div>
            </div>

            {/* Grid Layout: Profile Info & Feed */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Info card */}
              <div className="md:col-span-4 space-y-4">
                <Card className="border border-gray-150/60 shadow-sm rounded-2xl bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                    <CardTitle className="text-xs font-black text-gray-700 flex items-center gap-2">
                      <Shield size={14} className="text-orange-500" />
                      Giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs text-gray-600">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4.5 h-4.5 text-gray-300 shrink-0" />
                      <p className="font-semibold">
                        Vai trò: <span className="font-bold text-gray-800">{user.role === "admin" ? "Quản trị viên 👑" : "Khách hàng 👤"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4.5 h-4.5 text-gray-300 shrink-0" />
                      <p className="font-semibold truncate max-w-[200px]" title={user.email}>
                        Email: <span className="font-bold text-gray-800">{user.email}</span>
                      </p>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4.5 h-4.5 text-gray-300 shrink-0" />
                        <p className="font-semibold">
                          Điện thoại: <span className="font-bold text-gray-800">{user.phone}</span>
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4.5 h-4.5 text-gray-300 shrink-0" />
                      <p className="font-semibold">
                        Gia nhập:{" "}
                        <span className="font-bold text-gray-800">
                          {user.createdAt
                            ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })
                            : "N/A"}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* VIP Mascot Widget in sidebar for mobile/layout */}
                {mascotConfig && (
                  <Card className={cn("border shadow-sm rounded-2xl overflow-hidden cursor-pointer active:scale-98 transition-all duration-300", mascotConfig.containerClass)} onClick={() => mascotConfig.clickAction()}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                        <img src={mascotConfig.avatar} alt="Mascot avatar" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={cn("font-black text-[11px] italic flex items-center gap-1.5", mascotConfig.titleClass)}>
                          {mascotConfig.title} 💬
                        </h4>
                        <p className={cn("text-[9px] font-bold mt-0.5 line-clamp-2 leading-relaxed", mascotConfig.textClass)}>
                          {mascotConfig.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Recent Posts Feed */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <TrendingUp size={16} className="text-orange-500" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Bài đăng diễn đàn gần đây</h3>
                </div>

                {recentPosts.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-gray-400 font-medium italic text-xs shadow-sm">
                    🏢 Đạo hữu này chưa đăng bài viết nào trên diễn đàn.
                  </div>
                ) : (
                  recentPosts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/forum?postId=${post._id}`} // Wait! We link to forum with postId parameter or similar so they can locate it
                      className="block group bg-white border border-gray-150/60 rounded-2xl p-4 md:p-5 hover:border-orange-300 hover:shadow-md transition-all duration-300 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] rounded-lg">
                            {post.category === "review" ? "Review món" : post.category === "life" ? "Đời sống" : post.category === "knowledge" ? "Kiến thức" : "Tám chuyện"}
                          </Badge>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {post.createdAt ? format(new Date(post.createdAt), "dd/MM/yyyy", { locale: vi }) : "Vừa xong"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold border-t border-gray-50 pt-2.5">
                          <span className="flex items-center gap-1">
                            ❤️ {post.likes?.length || 0} lượt thích
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} /> {post.commentsCount || 0} bình luận
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
