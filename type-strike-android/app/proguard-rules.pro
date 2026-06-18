# Keep Retrofit interfaces
-keep,allowobfuscation interface com.typestrike.data.api.*

# Keep Gson serialized model classes
-keep class com.typestrike.data.model.** { *; }

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
