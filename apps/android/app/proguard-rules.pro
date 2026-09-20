# Proguard rules for MMedic Android
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.mmedic.data.model.** { *; }
