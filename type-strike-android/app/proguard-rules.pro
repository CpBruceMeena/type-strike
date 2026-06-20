# ── Generic type metadata (required by Gson for parameterized types) ──
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses

# ── Retrofit ───────────────────────────────────────────────
-keep,allowobfuscation interface com.typestrike.data.api.*
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-keepclassmembers enum retrofit2.http.* { *; }
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# ── OkHttp ─────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**

# ── Gson ───────────────────────────────────────────────────
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ── Data models (used by Gson reflection-based deserialization) ──
-keep class com.typestrike.data.model.** { *; }
-keep class com.typestrike.data.api.** { *; }

# ── Hilt / Dagger ──────────────────────────────────────────
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }

# ── Kotlin coroutines ──────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ── Kotlin serialization metadata (used by some Gson/Kotlin interop) ──
-keepclassmembers class kotlinx.** {
    volatile <fields>;
}
