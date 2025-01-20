import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/gallery/gallery_provider.dart';
import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/default_photo.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../config/ps_colors.dart';
import '../../../../../../config/route/route_paths.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/repository/gallery_repository.dart';
import '../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../core/vendor/viewobject/holder/request_path_holder.dart';
import '../../../../../custom_ui/item/detail/component/gallery_list/paid_ad_status_widget.dart';
import '../../../../common/ps_ui_widget.dart';
import '../../../../common/shimmer_item.dart';

class ProductDetailGalleryWidget extends StatefulWidget {
  const ProductDetailGalleryWidget({
    Key? key,
  }) : super(key: key);

  @override
  ProductDetailGalleryViewState<ProductDetailGalleryWidget> createState() =>
      ProductDetailGalleryViewState<ProductDetailGalleryWidget>();
}

class ProductDetailGalleryViewState<T extends ProductDetailGalleryWidget>
    extends State<ProductDetailGalleryWidget> {
  bool bindDataOneTime = true;
  String? selectedId;
  int selectedIndex = 0;
  bool isHaveVideo = false;
  DefaultPhoto? selectedDefaultImage;
  late ItemDetailProvider itemDetailProvider;
  late GalleryProvider provider;

  void onImageTap(int index) {
    setState(() {
      selectedIndex = index;
    });
  }

  void goToGalleryList() {
    Navigator.pushNamed(context, RoutePaths.galleryGrid,
        arguments: itemDetailProvider.product);
  }

  @override
  Widget build(BuildContext context) {
    itemDetailProvider = Provider.of<ItemDetailProvider>(context);
    final Product product = itemDetailProvider.product;
    if (product.videoThumbnail!.imgPath != '') {
      selectedDefaultImage = product.videoThumbnail;
      isHaveVideo = true;
    } else {
      selectedDefaultImage = product.defaultPhoto;
      isHaveVideo = false;
    }
    final PsValueHolder valueHolder =
        Provider.of<PsValueHolder>(context, listen: false);
    final AppLocalization langProvider =
        Provider.of<AppLocalization>(context, listen: false);
    print(
        '............................Build UI Again ............................');

    return SliverToBoxAdapter(
      child: ChangeNotifierProvider<GalleryProvider>(
          lazy: false,
          create: (BuildContext context) {
            provider = GalleryProvider(
                repo: Provider.of<GalleryRepository>(context, listen: false));
            provider.loadDataList(
                requestPathHolder: RequestPathHolder(
                    loginUserId: Utils.checkUserLoginId(valueHolder),
                    languageCode: langProvider.currentLocale.languageCode,
                    parentImgId: selectedDefaultImage?.imgParentId,
                    imageType: PsConst.ITEM_IMAGE_TYPE));
            return provider;
          },
          child: Consumer<GalleryProvider>(builder:
              (BuildContext context, GalleryProvider provider, Widget? child) {
            if (
                //provider.galleryList != null &&
                provider.galleryList.data != null &&
                    provider.galleryList.data!.isNotEmpty) {
              if (bindDataOneTime) {
                if (valueHolder.showItemVideo! && isHaveVideo) {
                  provider.tempGalleryList.data!.add(selectedDefaultImage!);
                  for (int i = 0;
                      i < valueHolder.maxImageCount &&
                          i < provider.galleryList.data!.length;
                      i++) {
                    provider.tempGalleryList.data!
                        .add(provider.galleryList.data![i]);
                  }
                } else {
                  for (int i = 0;
                      i < valueHolder.maxImageCount &&
                          i < provider.galleryList.data!.length;
                      i++) {
                    provider.tempGalleryList.data!
                        .add(provider.galleryList.data![i]);
                  }
                }
                bindDataOneTime = false;
              }
              /**UI Section is here */
              return Container(
                margin: EdgeInsets.only(
                    top: PsDimens.space8,
                    left: Directionality.of(context) == TextDirection.ltr
                        ? PsDimens.space16
                        : 0,
                    right: Directionality.of(context) != TextDirection.ltr
                        ? PsDimens.space16
                        : 0,
                    bottom: PsDimens.space4),
                child: Column(
                  children: <Widget>[
                    Stack(
                      children: <Widget>[
                        Padding(
                          padding: EdgeInsets.only(
                              right: Directionality.of(context) ==
                                      TextDirection.ltr
                                  ? PsDimens.space16
                                  : 0,
                              left: Directionality.of(context) !=
                                      TextDirection.ltr
                                  ? PsDimens.space16
                                  : 0),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4.0),
                            child: PsNetworkImageWithUrl(
                              photoKey: '',
                              width: double.infinity,
                              height: 260,
                              imageAspectRation: PsConst.Aspect_Ratio_1x,
                              imagePath: provider
                                  .tempGalleryList.data![selectedIndex].imgPath,
                              boxfit: BoxFit.cover,
                              onTap: goToGalleryList,
                            ),
                          ),
                        ),
                        if (valueHolder.showItemVideo! &&
                            isHaveVideo &&
                            selectedIndex == 0)
                          Positioned(
                            left: 1,
                            right: 1,
                            bottom: 1,
                            top: 1,
                            child: GestureDetector(
                              onTap: goToGalleryList,
                              child: Center(
                                child: Container(
                                  width: 100,
                                  height: 100,
                                  child: Icon(
                                    Icons.play_circle,
                                    color: PsColors.achromatic900,
                                    size: 80,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        Positioned(
                            bottom: 1,
                            right: 1,
                            child: CustomPaidAdStatusWidget()),
                      ],
                    ),
                    const SizedBox(
                      height: PsDimens.space12,
                    ),
                    SizedBox(
                      height: 60,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: provider.tempGalleryList.data!.length,
                        itemBuilder: (BuildContext context, int index) {
                          return Container(
                            margin: EdgeInsets.only(
                                right: Directionality.of(context) ==
                                        TextDirection.ltr
                                    ? PsDimens.space8
                                    : 0,
                                left: Directionality.of(context) !=
                                        TextDirection.ltr
                                    ? PsDimens.space8
                                    : 0),
                            child: Stack(
                              children: <Widget>[
                                Container(
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(6.0),
                                      border: Border.all(
                                          color: (index == selectedIndex)
                                              ? Theme.of(context).primaryColor
                                              : PsColors.achromatic900,
                                          width: 2)),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(4.0),
                                    child: PsNetworkImageWithUrl(
                                      photoKey: '',
                                      width: 72,
                                      imageAspectRation:
                                          PsConst.Aspect_Ratio_1x,
                                      imagePath: provider
                                          .tempGalleryList.data![index].imgPath,
                                      onTap: () {
                                        onImageTap(index);
                                      },
                                      boxfit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                                if (valueHolder.showItemVideo! &&
                                    isHaveVideo &&
                                    index == 0)
                                  Positioned(
                                    bottom: 1,
                                    left: 1,
                                    right: 1,
                                    top: 1,
                                    child: Icon(
                                      Icons.play_circle_outline,
                                      color: PsColors.achromatic50,
                                      size: 24,
                                    ),
                                  )
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            } else {
              return Container(
                height: 260,
                padding: const EdgeInsets.only(
                    top: PsDimens.space8,
                    left: PsDimens.space16,
                    right: PsDimens.space16,
                    bottom: PsDimens.space4),
                child: const ShimmerItem(),
              );
            }
          })),
    );
  }
}
