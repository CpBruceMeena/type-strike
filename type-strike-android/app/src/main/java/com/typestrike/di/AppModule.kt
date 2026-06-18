package com.typestrike.di

import android.content.Context
import com.typestrike.audio.SoundManager
import com.typestrike.data.api.ApiClient
import com.typestrike.data.api.TypeStrikeApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApi(): TypeStrikeApi = ApiClient.api

    @Provides
    @Singleton
    fun provideSoundManager(@ApplicationContext context: Context): SoundManager =
        SoundManager(context)
}
