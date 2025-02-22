import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../../core/vendor/viewobject/product_relation.dart';
import '../../../../common/price_dollar.dart';

class PriceWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider itemDetailProvider =
        Provider.of<ItemDetailProvider>(context);
    final PsValueHolder psValueHolder =
        Provider.of<PsValueHolder>(context, listen: false);
    final Product product = itemDetailProvider.product;
    final String? currencySymbol = product.itemCurrency?.currencySymbol ?? '';
    //check whether to show original price or discounted price
    final String? currentPrice =
        product.isDiscountedItem && psValueHolder.isShowDiscount!
            ? product.currentPrice
            : product.originalPrice;

    List<ProductRelation> qtyObj = <ProductRelation>[];
       final bool isLoginUserEmpty = Utils.isLoginUserEmpty(psValueHolder);  
    

    final List<ProductRelation> filteredList =
        product.productRelation?.where((ProductRelation pr) {
              return pr.coreKeyId == 'ps-itm00046';
            }).toList() ??
            <ProductRelation>[];

    if (filteredList.isNotEmpty) {
      qtyObj = filteredList;
      if (qtyObj != <dynamic>[]) {
        itemDetailProvider.quantity = int.parse(qtyObj[0].value.toString());
      }
    }

    /** UI Section is here */
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.only(
            top: PsDimens.space4,
            bottom: PsDimens.space4,
            left: PsDimens.space16,
            right: PsDimens.space16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                if (psValueHolder.selectPriceType == PsConst.NORMAL_PRICE)
                   (psValueHolder.hidePriceSetting == PsConst.ONE && isLoginUserEmpty==true)
                            ? Text(
                                '$currencySymbol\t*****',
                                textAlign: TextAlign.start,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium!
                                    .copyWith(
                                        fontSize: 21,
                                        color: Theme.of(context).primaryColor),
                              )
                            :

                  Text(
                      isPriceEmpty(currentPrice)
                          ? 'item_price_free'.tr
                          : '$currencySymbol${Utils.getPriceFormat(currentPrice!, psValueHolder.priceFormat!)}',
                      style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                          color: Theme.of(context).primaryColor,
                          fontSize: 16,
                          fontWeight: FontWeight.w400)),
                if (psValueHolder.selectPriceType == PsConst.NO_PRICE)
                  Container(),
                if (psValueHolder.selectPriceType == PsConst.PRICE_RANGE)
                  PriceDollar(product.originalPrice ?? ''),
                if (psValueHolder.isShowDiscount! &&
                    product.isDiscountedItem &&
                    psValueHolder.selectPriceType == PsConst.NORMAL_PRICE)
                        (psValueHolder.hidePriceSetting == PsConst.ONE && isLoginUserEmpty==true)?
                  const SizedBox():

                  Text(
                    //original price
                    '$currencySymbol${Utils.getPriceFormat(product.originalPrice ?? '', psValueHolder.priceFormat!)}',
                    textAlign: TextAlign.start,
                    style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                        color: Utils.isLightMode(context)
                            ? PsColors.text400
                            : PsColors.text300,
                        fontWeight: FontWeight.w400,
                        fontSize: 14),
                  ),
                if (psValueHolder.selectPriceType != PsConst.NO_PRICE)
                  Text(
                    product.addedDateStr ?? '',
                    style: Theme.of(context).textTheme.bodySmall!.copyWith(
                        color: Utils.isLightMode(context)
                            ? PsColors.text800
                            : PsColors.text50,
                        fontSize: 16,
                        fontWeight: FontWeight.w400),
                  )
              ],
            ),
            if (product.isSoldOutItem == false)
              Selector<ItemDetailProvider, int?>(
                  selector: (_, ItemDetailProvider provider) =>
                      provider.quantity,
                  builder: (_, int? qty, __) {
                    return (qty == null)
                        ? const SizedBox()
                        : Text(
                            '$qty Items In Stock',
                            textAlign: TextAlign.start,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium!
                                .copyWith(
                                    color: Utils.isLightMode(context)
                                        ? PsColors.text700
                                        : PsColors.text300,
                                    fontSize: 14),
                          );
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
