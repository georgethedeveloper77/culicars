import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/provider/product/item_entry_provider.dart';
import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/holder/intent_holder/map_pin_intent_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../../core/vendor/viewobject/product_relation.dart';
import '../../../../../../config/route/route_paths.dart';
import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/utils/utils.dart';
import '../../../../common/ps_ui_widget.dart';

class LocationWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider itemDetailProvider =
        Provider.of<ItemDetailProvider>(context);
    final PsValueHolder psValueHolder =
        Provider.of<PsValueHolder>(context, listen: false);
    final Product product = itemDetailProvider.product;

    /** UI Section is here */
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.only(
            top: PsDimens.space6,
            bottom: PsDimens.space4,
            left: PsDimens.space16,
            right: PsDimens.space16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Row(
              children: <Widget>[
                Container(
                  width: 18,
                  height: 18,
                  child: PsNetworkCircleImageForUser(
                    photoKey: '',
                    imagePath: product.user!.userCoverPhoto,
                    boxfit: BoxFit.cover,
                  ),
                ),
                const SizedBox(
                  width: 4,
                ),
                Text(
                  product.user!.userName == ''
                      ? 'default__user_name'.tr
                      : product.user!.userName ?? '',
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                        color: Utils.isLightMode(context)
                            ? PsColors.text500
                            : PsColors.text50,
                        fontSize: 14,
                      ),
                  maxLines: 1,
                )
              ],
            ),
            Consumer<ItemEntryFieldProvider>(builder: (BuildContext context,
                ItemEntryFieldProvider provider, Widget? child) {
              if (provider.hasData) {
                const String itemAddress = 'ps-itm00009';
                final int index2 = product.productRelation!.indexWhere(
                    (ProductRelation element) =>
                        element.coreKeyId == itemAddress);
                final bool showCustomDataAddress = index2 >= 0 &&
                    product.productRelation
                            ?.elementAt(index2)
                            .selectedValues?[0]
                            .value !=
                        '';
                return InkWell(
                  onTap: () async {
                    if (psValueHolder.isUseGoogleMap!) {
                      await Navigator.pushNamed(
                          context, RoutePaths.googleMapPin,
                          arguments: MapPinIntentHolder(
                              flag: PsConst.VIEW_MAP,
                              mapLat: product.lat,
                              mapLng: product.lng));
                    } else {
                      await Navigator.pushNamed(context, RoutePaths.mapPin,
                          arguments: MapPinIntentHolder(
                              flag: PsConst.VIEW_MAP,
                              mapLat: product.lat,
                              mapLng: product.lng));
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      Icon(
                        Icons.location_on_outlined,
                        color: Theme.of(context).primaryColor,
                        size: 16,
                      ),
                      const SizedBox(
                        width: PsDimens.space4,
                      ),
                      if (showCustomDataAddress)
                        Text(
                          product.productRelation
                                  ?.elementAt(index2)
                                  .selectedValues?[0]
                                  .value ??
                              '',
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.bodyLarge!.copyWith(
                                    color: Utils.isLightMode(context)
                                        ? PsColors.text500
                                        : PsColors.text50,
                                    fontSize: 14,
                                  ),
                          maxLines: 1,
                        )
                      else
                        Text(
                          '${product.itemLocationTownship!.townshipName}, ${product.itemLocation!.name}',
                          style:
                              Theme.of(context).textTheme.bodyLarge!.copyWith(
                                    color: Utils.isLightMode(context)
                                        ? PsColors.text500
                                        : PsColors.text50,
                                    fontSize: 14,
                                  ),
                        )
                    ],
                  ),
                );
              } else
                return const SizedBox();
            }),
          ],
        ),
      ),
    );
  }

  bool isPriceEmpty(String? price) {
    return price == null || price == '' || price == '0';
  }
}
