; ModuleID = 'dump.c'
source_filename = "dump.c"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx14.0.0"

; Function Attrs: noinline nounwind optnone ssp uwtable(sync)
define void @dump(i64 noundef %0) #0 {
  %2 = alloca i64, align 8
  %3 = alloca [32 x i8], align 1
  %4 = alloca i64, align 8
  store i64 %0, ptr %2, align 8
  store i64 1, ptr %4, align 8
  %5 = load i64, ptr %4, align 8
  %6 = sub i64 32, %5
  %7 = getelementptr inbounds [32 x i8], ptr %3, i64 0, i64 %6
  store i8 10, ptr %7, align 1
  br label %8

8:                                                ; preds = %21, %1
  %9 = load i64, ptr %2, align 8
  %10 = urem i64 %9, 10
  %11 = add i64 %10, 48
  %12 = trunc i64 %11 to i8
  %13 = load i64, ptr %4, align 8
  %14 = sub i64 32, %13
  %15 = sub i64 %14, 1
  %16 = getelementptr inbounds [32 x i8], ptr %3, i64 0, i64 %15
  store i8 %12, ptr %16, align 1
  %17 = load i64, ptr %4, align 8
  %18 = add i64 %17, 1
  store i64 %18, ptr %4, align 8
  %19 = load i64, ptr %2, align 8
  %20 = udiv i64 %19, 10
  store i64 %20, ptr %2, align 8
  br label %21

21:                                               ; preds = %8
  %22 = load i64, ptr %2, align 8
  %23 = icmp ne i64 %22, 0
  br i1 %23, label %8, label %24, !llvm.loop !6

24:                                               ; preds = %21
  %25 = load i64, ptr %4, align 8
  %26 = sub i64 32, %25
  %27 = getelementptr inbounds [32 x i8], ptr %3, i64 0, i64 %26
  %28 = load i64, ptr %4, align 8
  %29 = call i64 @"\01_write"(i32 noundef 1, ptr noundef %27, i64 noundef %28)
  ret void
}

declare i64 @"\01_write"(i32 noundef, ptr noundef, i64 noundef) #1

; Function Attrs: noinline nounwind optnone ssp uwtable(sync)
define i32 @main() #0 {
  %1 = alloca i32, align 4
  store i32 0, ptr %1, align 4
  call void @dump(i64 noundef 69)
  call void @dump(i64 noundef 420)
  ret i32 0
}

attributes #0 = { noinline nounwind optnone ssp uwtable(sync) "frame-pointer"="non-leaf" "min-legal-vector-width"="0" "no-trapping-math"="true" "probe-stack"="__chkstk_darwin" "stack-protector-buffer-size"="8" "target-cpu"="apple-m1" "target-features"="+aes,+crc,+crypto,+dotprod,+fp-armv8,+fp16fml,+fullfp16,+lse,+neon,+ras,+rcpc,+rdm,+sha2,+sha3,+sm4,+v8.1a,+v8.2a,+v8.3a,+v8.4a,+v8.5a,+v8a,+zcm,+zcz" }
attributes #1 = { "frame-pointer"="non-leaf" "no-trapping-math"="true" "probe-stack"="__chkstk_darwin" "stack-protector-buffer-size"="8" "target-cpu"="apple-m1" "target-features"="+aes,+crc,+crypto,+dotprod,+fp-armv8,+fp16fml,+fullfp16,+lse,+neon,+ras,+rcpc,+rdm,+sha2,+sha3,+sm4,+v8.1a,+v8.2a,+v8.3a,+v8.4a,+v8.5a,+v8a,+zcm,+zcz" }

!llvm.module.flags = !{!0, !1, !2, !3, !4}
!llvm.ident = !{!5}

!0 = !{i32 2, !"SDK Version", [2 x i32] [i32 14, i32 5]}
!1 = !{i32 1, !"wchar_size", i32 4}
!2 = !{i32 8, !"PIC Level", i32 2}
!3 = !{i32 7, !"uwtable", i32 1}
!4 = !{i32 7, !"frame-pointer", i32 1}
!5 = !{!"Apple clang version 15.0.0 (clang-1500.3.9.4)"}
!6 = distinct !{!6, !7}
!7 = !{!"llvm.loop.mustprogress"}
