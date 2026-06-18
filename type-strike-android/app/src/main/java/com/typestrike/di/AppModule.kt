package com.typestrike.di

import com.typestrike.data.api.ApiClient
import com.typestrike.data.api.TypeStrikeApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApi(): TypeStrikeApi = ApiClient.api
}
