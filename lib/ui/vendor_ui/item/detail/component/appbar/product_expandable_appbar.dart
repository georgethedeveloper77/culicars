import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../config/ps_colors.dart';
import '../../../../../../core/vendor/provider/history/history_provider.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../custom_ui/item/detail/component/appbar/widgets/pop_up_menu_widget.dart';

const int maxFailedLoadAttempts = 3;

class ProductExpandableAppbar extends StatefulWidget {
  const ProductExpandableAppbar({required this.isReadyToShowAppBarIcons, this.itemDetailBackIconOnTap});
  final bool isReadyToShowAppBarIcons;
  final Function()? itemDetailBackIconOnTap;

  @override
  State<ProductExpandableAppbar> createState() =>
      _ProductExpandableAppbarState();
}

class _ProductExpandableAppbarState extends State<ProductExpandableAppbar> {
  PsValueHolder? psValueHolder;
  InterstitialAd? _interstitialAd;
  int _numInterstitialLoadAttempts = 0;
  bool isFirstTime = false;

  static const AdRequest request = AdRequest(
    keywords: <String>['foo', 'bar'],
    contentUrl: 'http://foo.com/bar.html',
    nonPersonalizedAds: true,
  );
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _interstitialAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider provider =
        Provider.of<ItemDetailProvider>(context);
    final Product product = provider.product;
    final HistoryProvider historyProvider =
        Provider.of<HistoryProvider>(context);
    

    psValueHolder = Provider.of<PsValueHolder>(context);
    if (provider.hasData) {
      if (!isFirstTime) {
        processToShowAdInItemDetail(provider);
        historyProvider.addToDatabase(provider.product);
        isFirstTime = true;
      }
    }

    return SliverAppBar(
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarIconBrightness: Utils.getBrightnessForAppBar(context),
      ),
      iconTheme: Theme.of(context).iconTheme,
      titleSpacing: 0,
  
      title: Text(' '.tr,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium!.copyWith(
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic900
                  : PsColors.achromatic50,
              fontWeight: FontWeight.normal)),
      elevation: 0,
      actions: <Widget>[
        IconButton(
            onPressed: () {
              final Size size = MediaQuery.of(context).size;
              if (product.dynamicLink != null) {
                Share.share(
                  'Go to App:\n' + product.dynamicLink!,
                  sharePositionOrigin:
                      Rect.fromLTWH(0, 0, size.width, size.height / 2),
                );
              }
            },
            icon: Icon(Icons.share_outlined,
                color: Theme.of(context).primaryColor)),
        if (!Utils.isOwnerItem(psValueHolder!, product))
          const CustomPopUpMenuWidget()
      ],
    );
  }

  void processToShowAdInItemDetail(ItemDetailProvider provider) {
    if (provider.openDetailCountLimitExceeded &&
        psValueHolder!.isShowAdsInItemDetail!) {
      _createInterstitialAd();
      provider.replaceDetailOpenCount(0);
    } else {
      if (psValueHolder!.detailOpenCount == null) {
        provider.replaceDetailOpenCount(1);
      } else {
        final int i = psValueHolder!.detailOpenCount! + 1;
        provider.replaceDetailOpenCount(i);
      }
    }
  }

  void _createInterstitialAd() {
    InterstitialAd.load(
        adUnitId: Utils.getInterstitialUnitId(context),
        request: request,
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (InterstitialAd ad) {
            print('$ad loaded');
            _interstitialAd = ad;
            _numInterstitialLoadAttempts = 0;
            _interstitialAd!.setImmersiveMode(true);
            _interstitialAd!.show();
          },
          onAdFailedToLoad: (LoadAdError error) {
            print('InterstitialAd failed to load: $error.');
            _numInterstitialLoadAttempts += 1;
            _interstitialAd = null;
            if (_numInterstitialLoadAttempts <= maxFailedLoadAttempts) {
              _createInterstitialAd();
            }
          },
        ));
  }

  // void processToShowAdInItemDetail(ItemDetailProvider provider) {
  //   if (provider.openDetailCountLimitExceeded &&
  //       psValueHolder!.isShowAdsInItemDetail!) {
  //     _createInterstitialAd();
  //     provider.replaceDetailOpenCount(0);
  //   } else {
  //     if (psValueHolder!.detailOpenCount == null) {
  //       provider.replaceDetailOpenCount(1);
  //     } else {
  //       final int i = psValueHolder!.detailOpenCount! + 1;
  //       provider.replaceDetailOpenCount(i);
  //     }
  //   }
  // }

  // void _createInterstitialAd() {
  //   InterstitialAd.load(
  //       adUnitId: Utils.getInterstitialUnitId(context),
  //       request: request,
  //       adLoadCallback: InterstitialAdLoadCallback(
  //         onAdLoaded: (InterstitialAd ad) {
  //           print('$ad loaded');
  //           _interstitialAd = ad;
  //           _numInterstitialLoadAttempts = 0;
  //           _interstitialAd!.setImmersiveMode(true);
  //           _interstitialAd!.show();
  //         },
  //         onAdFailedToLoad: (LoadAdError error) {
  //           print('InterstitialAd failed to load: $error.');
  //           _numInterstitialLoadAttempts += 1;
  //           _interstitialAd = null;
  //           if (_numInterstitialLoadAttempts <= maxFailedLoadAttempts) {
  //             _createInterstitialAd();
  //           }
  //         },
  //       ));
  // }
}
