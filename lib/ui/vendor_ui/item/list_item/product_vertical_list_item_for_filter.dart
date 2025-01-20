import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// import '../../../../core/vendor/viewobject/product_relation.dart';
import 'package:remixicon/remixicon.dart';

import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/holder/intent_holder/product_detail_intent_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../config/ps_colors.dart';
import '../../../../config/route/route_paths.dart';
import '../../../../core/vendor/constant/ps_constants.dart';
import '../../../custom_ui/item/list_item/product_price_widget.dart';
import '../../common/bluemark_icon.dart';
import '../../common/ps_hero.dart';
import '../../common/ps_ui_widget.dart';
import '../../common/shimmer_item.dart';

class ProductVerticalListItemForFilter extends StatelessWidget {
  const ProductVerticalListItemForFilter(
      {Key? key,
      required this.product,
      this.onTap,
      this.coreTagKey,
      required this.animationController,
      required this.animation,
      this.isLoading = false})
      : super(key: key);

  final Product product;
  final Function? onTap;
  final AnimationController animationController;
  final Animation<double> animation;
  final String? coreTagKey;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    //print("${PsConfig.ps_app_image_thumbs_url}${subCategory.defaultPhoto.imgPath}");
    animationController.forward();
    final PsValueHolder valueHolder =
        Provider.of<PsValueHolder>(context, listen: false);
    // final bool showDiscount =
    //     valueHolder.isShowDiscount! && product.isDiscountedItem;

    // final Widget _smallDivider = Container(
    //   height: 10,
    //   color: PsColors.text300,
    //   width: 1,
    // );

    // const String itemMileageId = 'ps-itm00026';
    // final int index = product.productRelation!.indexWhere(
    //     (ProductRelation element) => element.coreKeyId == itemMileageId);

    // final bool showItemMileageData = index >= 0 &&
    //     product.productRelation?.elementAt(index).selectedValues?[0].value !=
    //         '';

    // const String itemContidionCustomId = 'ps-itm00004';
    // final int index2 = product.productRelation!.indexWhere(
    //     (ProductRelation element) =>
    //         element.coreKeyId == itemContidionCustomId);

    // final bool showItemConditionData = index2 >= 0 &&
    //     product.productRelation?.elementAt(index2).selectedValues?[0].value !=
    //         '';
    return AnimatedBuilder(
      animation: animationController,
      builder: (BuildContext context, Widget? child) {
        return FadeTransition(
            opacity: animation,
            child: Transform(
                transform: Matrix4.translationValues(
                    0.0, 100 * (1.0 - animation.value), 0.0),
                child: child));
      },
      child: Container(
        height: PsDimens.space120,
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(
            Radius.circular(PsDimens.space4),
          ),
          border: Border.all(
            color: Utils.isLightMode(context)
                ? PsColors.text50
                : PsColors.achromatic700,
            width: PsDimens.space1,
          ),
          color: Utils.isLightMode(context)
              ? PsColors.text50
              : PsColors.achromatic700,
        ),
        margin: const EdgeInsets.only(
            bottom: PsDimens.space16,
            left: PsDimens.space8,
            right: PsDimens.space8),
        padding: const EdgeInsets.all(PsDimens.space8),
        child: isLoading
            ? const ShimmerItem()
            : GestureDetector(
                onTap: () {
                  onDetailClick(context);
                  if (onTap != null) {
                    onTap!();
                  }
                },
                child: SizedBox(
                  height: (valueHolder.isShowOwnerInfo!)
                      ? PsDimens.space88
                      : PsDimens.space80,
                  child: Stack(
                    children: <Widget>[
                      Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: <Widget>[
                            Stack(
                              children: <Widget>[
                                ClipRRect(
                                  borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(4),
                                      bottomLeft: Radius.circular(4)),
                                  child: PsNetworkImage(
                                    width: PsDimens.space100,
                                    height: MediaQuery.of(context).size.height,
                                    photoKey:
                                        '$coreTagKey${product.id}${PsConst.HERO_TAG__IMAGE}',
                                    defaultPhoto: product.defaultPhoto!,
                                    imageAspectRation: PsConst.Aspect_Ratio_2x,
                                    boxfit: BoxFit.cover,
                                    onTap: () {
                                      onDetailClick(context);
                                      if (onTap != null) {
                                        onTap!();
                                      }
                                    },
                                  ),
                                ),
                                Container(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      if (product.isSoldOutItem)
                                        Container(
                                          margin: const EdgeInsets.only(
                                              top: PsDimens.space4,
                                              left: PsDimens.space4,
                                              right: PsDimens.space4),
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 2),
                                          height: 14,
                                          decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      PsDimens.space4),
                                              color: PsColors.error700),
                                          child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: <Widget>[
                                                Icon(
                                                  Remix.delete_back_2_line,
                                                  size: 12,
                                                  color: PsColors.achromatic50,
                                                ),
                                                const SizedBox(
                                                  width: PsDimens.space2,
                                                ),
                                                Text('dashboard__sold_out'.tr,
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodyMedium!
                                                        .copyWith(
                                                            fontSize: 10,
                                                            color: PsColors
                                                                .achromatic50))
                                              ]),
                                        ),
                                      if (product.paidStatus ==
                                          PsConst.PAID_AD_PROGRESS)
                                        Container(
                                          margin: const EdgeInsets.only(
                                              top: PsDimens.space4,
                                              left: PsDimens.space4,
                                              right: PsDimens.space4),
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 2),
                                          height: 14,
                                          decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      PsDimens.space4),
                                              color: PsColors.achromatic50),
                                          child: Row(children: <Widget>[
                                            Icon(
                                              Remix.fire_fill,
                                              size: 12,
                                              color: PsColors.primary500,
                                            ),
                                            const SizedBox(
                                              width: PsDimens.space2,
                                            ),
                                            Text('dashboard__is_featured'.tr,
                                                textAlign: TextAlign.start,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodyMedium!
                                                    .copyWith(
                                                        fontSize: 10,
                                                        color: PsColors
                                                            .primary500))
                                          ]),
                                        ),
                                      if (product.isDiscountedItem)
                                        Container(
                                          margin: const EdgeInsets.only(
                                              top: PsDimens.space4,
                                              left: PsDimens.space4,
                                              right: PsDimens.space4),
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 2),
                                          height: 14,
                                          decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                              color: PsColors.error500),
                                          child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: <Widget>[
                                                Icon(
                                                  Icons.discount_outlined,
                                                  size: 12,
                                                  color: PsColors.achromatic50,
                                                ),
                                                const SizedBox(
                                                  width: PsDimens.space2,
                                                ),
                                                Text(
                                                    '${product.discountRate}% ${'dashboard__is_discount'.tr}',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodyMedium!
                                                        .copyWith(
                                                            fontSize: 10,
                                                            color: PsColors
                                                                .achromatic50))
                                              ]),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(
                              width: PsDimens.space8,
                            ),
                            InkWell(
                              onTap: () {
                                onDetailClick(context);
                                if (onTap != null) {
                                  onTap!();
                                }
                              },
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: <Widget>[
                                  if (valueHolder.isShowOwnerInfo! &&
                                      product.vendorId != '' &&
                                      valueHolder.vendorFeatureSetting ==
                                          PsConst.ONE)
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: <Widget>[
                                        Stack(children: <Widget>[
                                          Container(
                                            child: Stack(
                                              children: <Widget>[
                                                PsNetworkCircleImageForUser(
                                                  width: PsDimens.space24,
                                                  height: PsDimens.space24,
                                                  photoKey: '',
                                                  imagePath: product.vendorUser
                                                      ?.logo?.imgPath,
                                                  boxfit: BoxFit.cover,
                                                  onTap: () {
                                                    onDetailClick(context);
                                                  },
                                                ),
                                                if (product.vendorUser
                                                        ?.expiredStatus ==
                                                    PsConst.EXPIRED_NOTI)
                                                  Container(
                                                      decoration: BoxDecoration(
                                                        shape: BoxShape.circle,
                                                        color: PsColors
                                                            .achromatic900
                                                            .withOpacity(0.75),
                                                      ),
                                                      alignment: Alignment
                                                          .center,
                                                      width: PsDimens.space24,
                                                      height: PsDimens.space24,
                                                      child: Text('Closed',
                                                          style: Theme
                                                                  .of(context)
                                                              .textTheme
                                                              .bodySmall
                                                              ?.copyWith(
                                                                  color: PsColors
                                                                      .achromatic50,
                                                                  fontSize: 6)))
                                                else
                                                  const SizedBox(),
                                              ],
                                            ),
                                          ),
                                          if (product.vendorUser!.isVendorUser)
                                            Positioned(
                                              right: -1,
                                              bottom: -1,
                                              child: Icon(Icons.verified_user,
                                                  color: PsColors.info500,
                                                  size: PsDimens.space12
                                                  // valueHolder.bluemarkSize,
                                                  ),
                                            ),
                                        ]),
                                        const SizedBox(width: PsDimens.space8),
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: <Widget>[
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.start,
                                              children: <Widget>[
                                                Text(
                                                    product.vendorUser?.name ==
                                                            ''
                                                        ? 'default__user_name'
                                                            .tr
                                                        : '${product.vendorUser?.name}',
                                                    textAlign: TextAlign.start,
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!),
                                                const SizedBox(
                                                    width: PsDimens.space4),
                                                Image.asset(
                                                  'assets/images/storefont.png',
                                                  width: 10,
                                                  height: 10,
                                                ),
                                              ],
                                            ),
                                            Text('${product.addedDateStr}',
                                                textAlign: TextAlign.start,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall!
                                                    .copyWith(
                                                        color: Utils
                                                                .isLightMode(
                                                                    context)
                                                            ? PsColors.text500
                                                            : PsColors.text400))
                                          ],
                                        )
                                      ],
                                    )

                                  ///
                                  // CustomProductShopOwnerInfoWidget(
                                  //   tagKey: coreTagKey ?? '',
                                  //   product: product,
                                  // )
                                  else if (valueHolder.isShowOwnerInfo!)
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.start,
                                      children: <Widget>[
                                        Stack(children: <Widget>[
                                          PsNetworkCircleImageForUser(
                                            width: PsDimens.space24,
                                            height: PsDimens.space24,
                                            photoKey: '',
                                            imagePath:
                                                product.user?.userCoverPhoto,
                                            boxfit: BoxFit.cover,
                                            onTap: () {
                                              onDetailClick(context);
                                            },
                                          ),
                                          if (product
                                              .user!.isVefifiedBlueMarkUser)
                                            const Positioned(
                                              right: -1,
                                              bottom: -1,
                                              child: BluemarkIcon(),
                                            ),
                                        ]),
                                        const SizedBox(
                                          width: PsDimens.space8,
                                        ),
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          children: <Widget>[
                                            Text(
                                                product.user?.userName == ''
                                                    ? 'default__user_name'.tr
                                                    : '${product.user?.userName}',
                                                textAlign: TextAlign.start,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall!
                                                    .copyWith(
                                                        color: Utils
                                                                .isLightMode(
                                                                    context)
                                                            ? PsColors.text700
                                                            : PsColors
                                                                .achromatic50)),
                                            Text('${product.addedDateStr}',
                                                textAlign: TextAlign.start,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall!),
                                          ],
                                        ),
                                      ],
                                    ),
                                  const SizedBox(
                                    height: 2,
                                  ),
                                  CustomProductPriceWidget(
                                    product: product,
                                    tagKey: coreTagKey!,
                                  ),

                                  PsHero(
                                    tag:
                                        '$coreTagKey${product.id}$PsConst.HERO_TAG__TITLE',
                                    child: Container(
                                      // width: 200,
                                      child: Text(
                                        product.title!,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium!
                                            .copyWith(
                                                fontSize: 14,
                                                color:
                                                    Utils.isLightMode(context)
                                                        ? PsColors.text900
                                                        : PsColors.text300,
                                                fontWeight: FontWeight.w400),
                                        maxLines: 1,
                                      ),
                                    ),
                                  ),
                                  // Row(
                                  //   mainAxisAlignment: MainAxisAlignment.start,
                                  //   children: <Widget>[
                                  //     if (showItemMileageData)
                                  //       Row(
                                  //         children: <Widget>[
                                  //           Icon(
                                  //             Remix.steering_2_line,
                                  //             size: 12,
                                  //             color: PsColors.text300,
                                  //           ),
                                  //           const SizedBox(
                                  //             width: 4,
                                  //           ),
                                  //           Text(
                                  //               product.productRelation
                                  //                       ?.elementAt(index)
                                  //                       .selectedValues?[0]
                                  //                       .value ??
                                  //                   '',
                                  //               overflow: TextOverflow.ellipsis,
                                  //               textAlign: TextAlign.start,
                                  //               style: Theme.of(context)
                                  //                   .textTheme
                                  //                   .bodySmall!
                                  //                   .copyWith(
                                  //                       fontSize: 12,
                                  //                       color: PsColors
                                  //                           .secondary400)),
                                  //           const SizedBox(
                                  //             width: 4,
                                  //           ),
                                  //           _smallDivider,
                                  //           const SizedBox(width: 4),
                                  //         ],
                                  //       ),
                                  //     if (showItemConditionData)
                                  //       Row(
                                  //         children: <Widget>[
                                  //           Icon(
                                  //             Remix.price_tag_3_line,
                                  //             size: 12,
                                  //             color: PsColors.text300,
                                  //           ),
                                  //           const SizedBox(
                                  //             width: 4,
                                  //           ),
                                  //           Text(
                                  //               product.productRelation
                                  //                       ?.elementAt(index2)
                                  //                       .selectedValues?[0]
                                  //                       .value ??
                                  //                   '',
                                  //               overflow: TextOverflow.ellipsis,
                                  //               textAlign: TextAlign.start,
                                  //               style: Theme.of(context)
                                  //                   .textTheme
                                  //                   .bodySmall!
                                  //                   .copyWith(
                                  //                       fontSize: 12,
                                  //                       color: PsColors
                                  //                           .secondary400)),
                                  //           const SizedBox(width: 4),
                                  //           _smallDivider,
                                  //           const SizedBox(width: 4),
                                  //         ],
                                  //       ),
                                  //     Row(
                                  //       children: <Widget>[
                                  //         Icon(
                                  //           Icons.location_on_outlined,
                                  //           size: 12,
                                  //           color: PsColors.text300,
                                  //         ),
                                  //         const SizedBox(width: 4),
                                  //         Text(
                                  //             valueHolder.isSubLocation ==
                                  //                     PsConst.ONE
                                  //                 ? (product.itemLocationTownship!
                                  //                                 .townshipName !=
                                  //                             '' &&
                                  //                         product.itemLocationTownship!
                                  //                                 .townshipName !=
                                  //                             null)
                                  //                     ? // check optional township is empty
                                  //                     '${product.itemLocationTownship!.townshipName}'
                                  //                     : '${product.itemLocation!.name}'
                                  //                 : '${product.itemLocation!.name}',
                                  //             overflow: TextOverflow.ellipsis,
                                  //             textAlign: TextAlign.start,
                                  //             maxLines: 1,
                                  //             style: Theme.of(context)
                                  //                 .textTheme
                                  //                 .bodySmall!
                                  //                 .copyWith(
                                  //                     fontSize: 12,
                                  //                     color: PsColors
                                  //                         .secondary400)),
                                  //       ],
                                  //     ),
                                  //],
                                  // ),
                                ],
                              ),
                            ),
                          ]),
                      if (!Utils.isOwnerItem(valueHolder, product))
                        Container(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: <Widget>[
                              Container(
                                padding: const EdgeInsets.only(
                                    top: PsDimens.space4,
                                    left: PsDimens.space4,
                                    right: PsDimens.space4,
                                    bottom: PsDimens.space4),
                                decoration: BoxDecoration(
                                    color: PsColors.achromatic50,
                                    border: Border.all(
                                        color: PsColors.achromatic50),
                                    borderRadius:
                                        BorderRadius.circular(PsDimens.space4)),
                                child: GestureDetector(
                                    onTap: () {
                                      onDetailClick(context);
                                    },
                                    child: product.isFavourited ==
                                                PsConst.ZERO ||
                                            Utils.isLoginUserEmpty(valueHolder)
                                        ? Icon(Icons.favorite_border,
                                            color: PsColors.primary500,
                                            size: 20)
                                        : Icon(Icons.favorite,
                                            color: PsColors.primary500,
                                            size: 20)),
                              ),
                            ],
                          ),
                          //),
                        ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  void onDetailClick(BuildContext context) {
    if (!isLoading) {
      print(product.defaultPhoto!.imgPath);
      final ProductDetailIntentHolder holder = ProductDetailIntentHolder(
          productId: product.id,
          heroTagImage: coreTagKey! + product.id! + PsConst.HERO_TAG__IMAGE,
          heroTagTitle: coreTagKey! + product.id! + PsConst.HERO_TAG__TITLE);
      Navigator.pushNamed(context, RoutePaths.productDetail, arguments: holder);
    }
  }
}
