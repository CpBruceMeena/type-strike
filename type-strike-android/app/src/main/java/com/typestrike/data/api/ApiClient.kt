package com.typestrike.data.api

import com.typestrike.BuildConfig
import okhttp3.Dns
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.InetAddress
import java.util.concurrent.TimeUnit

/**
 * Singleton Retrofit client configured to talk to the Go backend.
 */
object ApiClient {

    /**
     * Hardcoded IPs for the ngrok tunnel hostname.
     * Refresh these if the ngrok tunnel is recreated.
     */
    private val ngrokIpAddresses: List<InetAddress> by lazy {
        try {
            listOf(
                "3.6.122.107",
                "3.6.30.85",
                "13.234.229.229",
                "13.202.234.110",
                "13.204.33.47"
            ).map { InetAddress.getByName(it) }
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * Custom DNS resolver that maps the ngrok hostname to its known IP addresses.
     * This works around emulators where the system DNS resolution is broken.
     */
    private val customDns = object : Dns {
        override fun lookup(hostname: String): List<InetAddress> {
            val baseUrlHost = BuildConfig.BASE_URL
                .replace("https://", "")
                .replace("http://", "")
                .trimEnd('/')
            return if (hostname == baseUrlHost && ngrokIpAddresses.isNotEmpty()) {
                ngrokIpAddresses
            } else {
                Dns.SYSTEM.lookup(hostname)
            }
        }
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG)
            HttpLoggingInterceptor.Level.BODY
        else
            HttpLoggingInterceptor.Level.NONE
    }

    private val okHttpClient = OkHttpClient.Builder()
        .dns(customDns)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL + "/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api: TypeStrikeApi = retrofit.create(TypeStrikeApi::class.java)
}
