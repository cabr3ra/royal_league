from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('player_list/', views.PlayerList.as_view()),
    path('players/<int:pk>/', views.PlayerDetail.as_view()),
    path('career_list/', views.CareerList.as_view()),
    path('player/', views.player_view, name='player'),
    path('career/', views.career_view, name='career'),
    path('clock/', views.clock_view, name='clock'),
    path('train/', views.train_view, name='train'),
    path('search/player/', views.search_player, name='search_player'),    
    path('search/career/', views.search_career, name='search_career'),
    path('daily_player/', views.get_daily_player, name='daily_player'),
    path('daily_career/', views.get_daily_career, name='daily_career'),
    path('random_player/', views.get_random_player, name='random_player'),
    path("compare/player/", views.compare_player, name="compare_player"),
    path("compare/career/", views.compare_career, name="compare_career"),
    path("compare/random_player/", views.compare_random_player, name="compare_random_player"),
    path('attempts/', views.get_attempts, name='get_attempts'),
    path('attempts/decrement/', views.decrement_attempts, name='decrement_attempts'),
    path('attempts/reset/', views.reset_attempts, name='reset_attempts'),
]