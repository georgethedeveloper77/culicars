import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../../../../../config/ps_colors.dart';
import '../../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../../core/vendor/viewobject/holder/intent_holder/user_intent_holder.dart';
import '../../../../../../../../core/vendor/viewobject/user.dart';
import '../../../../../../config/route/route_paths.dart';
import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../common/bluemark_icon.dart';
import '../../../../common/ps_bottom_sheet.dart';
import '../../../../common/ps_ui_widget.dart';
import '../../../../common/user_rating_widget.dart';

class SellerInfoTileView extends StatefulWidget {
  @override
  State<SellerInfoTileView> createState() => _SellerInfoTileViewState();
}

class _SellerInfoTileViewState extends State<SellerInfoTileView> {
  late UserProvider userProvider;

  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider provider =
        Provider.of<ItemDetailProvider>(context);

    final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);

    final User? productOwner = provider.productOwner;
    if (productOwner == null ||
        Utils.isOwnerItem(psValueHolder, provider.product))
      return const SliverToBoxAdapter(child: SizedBox());

    if (provider.product.vendorId != '' && //item is from vendor
        psValueHolder.vendorFeatureSetting == PsConst.ONE)
      return const SliverToBoxAdapter(child: SizedBox());

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(
            vertical: PsDimens.space6, horizontal: PsDimens.space16),
        height: PsDimens.space40,
        child: InkWell(
          highlightColor: PsColors.achromatic100,
          onTap: () {
            PsBottomSheet.show(
                context,
                InkWell(
                  onTap: onSellerInfoClick,
                  child: Column(
                    children: <Widget>[
                      Text(provider.product.user!.userAboutMe ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .bodyLarge!
                              .copyWith(
                                  color: Utils.isLightMode(context)
                                      ? PsColors.text300
                                      : PsColors.text50)),
                      Container(
                        margin: const EdgeInsets.only(
                          top: PsDimens.space24,
                          bottom: PsDimens.space16,
                        ),
                        decoration: BoxDecoration(
                          color: Utils.isLightMode(context)
                              ? PsColors.achromatic100
                              : PsColors.achromatic900,
                          borderRadius: const BorderRadius.all(
                              Radius.circular(PsDimens.space4)),
                        ),
                        child: Padding(
                            padding: const EdgeInsets.only(
                                top: PsDimens.space16,
                                bottom: PsDimens.space16,
                                left: PsDimens.space16,
                                right: PsDimens.space16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: <Widget>[
                                //image
                                Container(
                                  width: 50,
                                  height: 50,
                                  child: PsNetworkCircleImageForUser(
                                    photoKey: '',
                                    imagePath:
                                        provider.product.user!.userCoverPhoto,
                                    boxfit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(
                                  width: PsDimens.space12,
                                ),
                                Flexible(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.start,
                                        children: <Widget>[
                                          //username
                                          Flexible(
                                            child: Text(
                                                provider.product.user!
                                                            .userName ==
                                                        ''
                                                    ? 'default__user_name'.tr
                                                    : provider.product.user!
                                                            .userName ??
                                                        '',
                                                overflow: TextOverflow.ellipsis,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .titleMedium!
                                                    .copyWith(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      // color: Utils
                                                      //         .isLightMode(
                                                      //             context)
                                                      //     ? PsColors
                                                      //         .text400
                                                      //     : PsColors
                                                      //         .textColor2
                                                    )),
                                          ),
                                          if (productOwner
                                              .isVefifiedBlueMarkUser)
                                            const BluemarkIcon()
                                        ],
                                      ),
                                      if (productOwner.showEmail)
                                        Padding(
                                          padding:
                                              const EdgeInsets.only(top: 4.0),
                                          child: Text(
                                            provider.product.user!.userEmail ??
                                                '',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge!
                                                .copyWith(
                                                    color: Utils.isLightMode(
                                                            context)
                                                        ? PsColors.text400
                                                        : PsColors.text50),
                                          ),
                                        ),
                                      const SizedBox(
                                        height: PsDimens.space4,
                                      ),
                                      UserRatingWidgetWithReviews(
                                        user: provider.product.user,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            )),
                      ),
                      if (productOwner.showPhone &&
                          provider.productOwner!.hasPhone)
                        Container(
                          margin: const EdgeInsets.only(
                            bottom: PsDimens.space16,
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: PsDimens.space16,
                              vertical: PsDimens.space8),
                          decoration: BoxDecoration(
                            color: Utils.isLightMode(context)
                                ? PsColors.achromatic100
                                : PsColors.achromatic900,
                            borderRadius: const BorderRadius.all(
                                Radius.circular(PsDimens.space4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: <Widget>[
                              Text('Contact',
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium!
                                      .copyWith(
                                          color: Utils.isLightMode(context)
                                              ? PsColors.achromatic900
                                              : PsColors.text50)),
                              const SizedBox(
                                height: 16,
                              ),
                              Row(
                                children: <Widget>[
                                  Flexible(
                                    child: Row(
                                      children: <Widget>[
                                        InkWell(
                                          child: Ink(
                                            color: Utils.isLightMode(context)
                                                ? PsColors.achromatic800
                                                : PsColors.achromatic50,
                                            child: Text(
                                              provider.product.user!
                                                      .userPhone ??
                                                  '',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium!
                                                  .copyWith(
                                                      color: Utils.isLightMode(
                                                              context)
                                                          ? PsColors.text800
                                                          : PsColors.text50,
                                                      fontWeight:
                                                          FontWeight.normal),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: <Widget>[
                                      InkWell(
                                        child: Icon(Icons.call_outlined,
                                            size: 25,
                                            color:
                                                Theme.of(context).primaryColor),
                                        onTap: () async {
                                          if (await canLaunchUrl(Uri.parse(
                                              'tel://${provider.product.user!.userPhone}'))) {
                                            await launchUrl(Uri.parse(
                                                'tel://${provider.product.user!.userPhone}'));
                                          } else {
                                            throw 'Could not Call Phone Number 1';
                                          }
                                        },
                                      ),
                                      const SizedBox(width: PsDimens.space16),
                                      InkWell(
                                          onTap: () async {
                                            if (await canLaunchUrl(Uri.parse(
                                                'sms://${provider.product.user!.userPhone}'))) {
                                              await launchUrl(Uri.parse(
                                                  'sms://${provider.product.user!.userPhone}'));
                                            } else {
                                              throw 'Could not send Phone Number 1';
                                            }
                                          },
                                          child: Icon(Icons.sms_outlined,
                                              size: 25,
                                              color: Theme.of(context)
                                                  .primaryColor)),
                                    ],
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                title: 'seller_info'.tr);
          },
          child: Ink(
            child: Container(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text('seller_info'.tr,
                      style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 18,
                            color: Utils.isLightMode(context)
                                ? PsColors.text800
                                : PsColors.text50,
                          )),
                  const Icon(Icons.chevron_right_outlined)
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void onSellerInfoClick() {
    final ItemDetailProvider provider =
        Provider.of<ItemDetailProvider>(context, listen: false);
    Navigator.pushNamed(context, RoutePaths.userDetail,
        arguments: UserIntentHolder(
            userId: provider.product.addedUserId,
            userName: provider.product.user?.userName ?? ''));
  }
}
